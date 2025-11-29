import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody } from '@/lib/api-utils';
import { createSuccessResponse, createErrorResponse } from '@/lib/create-response';
import { hashString, verifyHashString } from '@/lib/server-utils';
import { authCrudOperations } from '@/lib/auth';
import { z } from 'zod';

/**
 * CONFIGURACIÓN (ajusta según tu entorno)
 */
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutos
const PASSWORD_HISTORY_LIMIT = 5; // no permitir reutilizar las últimas 5 contraseñas

const resetPasswordSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  passcode: z
    .string()
    .min(6, 'Please provide a 6-digit verification code')
    .max(6, 'Verification code must be 6 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 * Hook para enviar correo — implementa tu propio mailer en el proyecto.
 * Ejemplo:
 *   await sendMail({ to: user.email, subject: 'Tu contraseña ha sido cambiada', html: '...' })
 */
async function sendMailNotification(/* mailOptions */) {
  // Implementa aquí tu integración con SendGrid, SES, SMTP, etc.
  // Ejemplo (pseudocódigo):
  // await mailer.send({
  //   to: mailOptions.to,
  //   subject: mailOptions.subject,
  //   html: mailOptions.html
  // });
  return;
}

export const POST = requestMiddleware(async (request: NextRequest) => {
  try {
    const body = await validateRequestBody(request);
    const validated = resetPasswordSchema.parse(body);

    const {
      usersCrud,
      userPasscodeCrud,
      sessionsCrud,
      refreshTokensCrud,
      userPasswordsCrud, // opcional: tabla para historial de contraseñas
      auditoriaCrud, // opcional: tabla de auditoría
      transaction, // opcional: si tu authCrudOperations soporta transacciones
    } = await authCrudOperations();

    // 1) obtener el registro más reciente del passcode
    const [passcodeRecord] = await userPasscodeCrud.findMany(
      { pass_object: validated.email },
      { orderBy: { column: 'id', direction: 'desc' } }
    );

    const isValidExpiration =
      passcodeRecord && new Date(passcodeRecord.valid_until).getTime() > Date.now();

    if (
      !passcodeRecord ||
      !passcodeRecord.passcode ||
      passcodeRecord.revoked ||
      !isValidExpiration
    ) {
      // Registrar intento fallido en auditoría si está disponible
      try {
        if (auditoriaCrud) {
          await auditoriaCrud.create({
            tabla: 'user_passcodes',
            accion: 'RESET_PASSWORD_FAIL_PASSCODE_INVALID',
            registro_id: null,
            usuario_id: null,
            meta: JSON.stringify({ email: validated.email }),
          });
        }
      } catch (e) {
        // ignore audit errors
      }

      return createErrorResponse({
        errorMessage: 'Invalid verification code',
        status: 401,
      });
    }

    const passcodeMatches = await verifyHashString(validated.passcode, passcodeRecord.passcode);

    if (!passcodeMatches) {
      // incrementar contador de intentos fallidos en userPasscodeCrud o usersCrud
      try {
        // Si la tabla de passcodes tiene campo failed_attempts, úsalo; si no, almacenarlo en users
        await userPasscodeCrud.update(passcodeRecord.id, {
          failed_attempts: (passcodeRecord.failed_attempts || 0) + 1,
        });
      } catch (_) {}

      // Auditar intento fallido
      try {
        if (auditoriaCrud) {
          await auditoriaCrud.create({
            tabla: 'user_passcodes',
            accion: 'RESET_PASSWORD_FAIL_PASSCODE_MISMATCH',
            registro_id: passcodeRecord.id,
            usuario_id: null,
            meta: JSON.stringify({ email: validated.email }),
          });
        }
      } catch (e) {}

      return createErrorResponse({
        errorMessage: 'Invalid verification code',
        status: 401,
      });
    }

    // 2) localizar usuario
    const [user] = await usersCrud.findMany({ email: validated.email });

    if (!user) {
      return createErrorResponse({
        errorMessage: 'User does not exist',
        status: 404,
      });
    }

    // 3) CHECK: lockout por intentos fallidos en user record
    const now = Date.now();
    if (user.lockout_until && new Date(user.lockout_until).getTime() > now) {
      const remaining = Math.ceil((new Date(user.lockout_until).getTime() - now) / 1000);
      return createErrorResponse({
        errorMessage: `Account temporarily locked. Try again in ${remaining} seconds`,
        status: 423, // Locked
      });
    }

    // 4) Verificar historial de contraseñas (si userPasswordsCrud existe)
    if (userPasswordsCrud) {
      const history = await userPasswordsCrud.findMany(
        { user_id: user.id },
        { orderBy: { column: 'created_at', direction: 'desc' }, limit: PASSWORD_HISTORY_LIMIT }
      );

      // comprobar si la nueva contraseña coincide con alguna de las últimas N
      for (const h of history) {
        if (await verifyHashString(validated.password, h.password_hash)) {
          return createErrorResponse({
            errorMessage: `Cannot reuse one of the last ${PASSWORD_HISTORY_LIMIT} passwords`,
            status: 400,
          });
        }
      }
    }

    // 5) Hash de la nueva contraseña
    const newHashedPassword = await hashString(validated.password);

    // 6) Operaciones atómicas: si tu authCrudOperations provee `transaction`, úsala
    // Si no, ejecutamos secuencialmente y tratamos errores limpiamente.
    if (typeof transaction === 'function') {
      // suponiendo que transaction acepta async callback
      await transaction(async (trx) => {
        // actualizar password en users
        await usersCrud.update(user.id, { password: newHashedPassword }, { trx });

        // añadir entrada al historial de contraseñas (si existe)
        if (userPasswordsCrud) {
          await userPasswordsCrud.create(
            {
              user_id: user.id,
              password_hash: newHashedPassword,
            },
            { trx }
          );

          // mantener solo las últimas N
          const oldHistory = await userPasswordsCrud.findMany(
            { user_id: user.id },
            { orderBy: { column: 'created_at', direction: 'desc' } , offset: PASSWORD_HISTORY_LIMIT }
          );

          for (const old of oldHistory) {
            await userPasswordsCrud.delete(old.id, { trx }).catch(() => {});
          }
        }

        // revocar passcode
        await userPasscodeCrud.update(passcodeRecord.id, { revoked: true }, { trx });

        // revocar refresh tokens asociados y marcar sesiones como 'revoked' o 'closed'
        const refreshRecords = await refreshTokensCrud.findMany({ user_id: user.id, revoked: false });
        for (const r of refreshRecords) {
          await refreshTokensCrud.update(r.id, { revoked: true }, { trx }).catch(() => {});
        }

        const sessions = await sessionsCrud.findMany({ user_id: user.id });
        for (const s of sessions) {
          await sessionsCrud.update(s.id, { revoked: true, updated_at: new Date().toISOString() }, { trx }).catch(() => {});
        }

        // actualizar contador de intentos y lockout en tabla users
        await usersCrud.update(user.id, { failed_attempts: 0, lockout_until: null }, { trx });

        // auditoría
        if (auditoriaCrud) {
          await auditoriaCrud.create(
            {
              tabla: 'users',
              accion: 'RESET_PASSWORD_SUCCESS',
              registro_id: user.id,
              usuario_id: user.id,
              meta: JSON.stringify({ by: 'passcode', passcode_id: passcodeRecord.id }),
            },
            { trx }
          );
        }
      }); // fin transaction
    } else {
      // fallback sin transacción
      // actualizar password
      await usersCrud.update(user.id, { password: newHashedPassword });

      // historial
      if (userPasswordsCrud) {
        await userPasswordsCrud.create({ user_id: user.id, password_hash: newHashedPassword });
        // limpiar historia antigua (si tu CRUD soporta offset/limit)
        const oldHistory = await userPasswordsCrud.findMany(
          { user_id: user.id },
          { orderBy: { column: 'created_at', direction: 'desc' }, offset: PASSWORD_HISTORY_LIMIT }
        );
        for (const old of oldHistory) {
          await userPasswordsCrud.delete(old.id).catch(() => {});
        }
      }

      // revocar passcode
      await userPasscodeCrud.update(passcodeRecord.id, { revoked: true });

      // revocar refresh tokens
      const refreshRecords = await refreshTokensCrud.findMany({ user_id: user.id, revoked: false });
      for (const r of refreshRecords) {
        await refreshTokensCrud.update(r.id, { revoked: true }).catch(() => {});
      }

      // cerrar sesiones
      const sessions = await sessionsCrud.findMany({ user_id: user.id });
      for (const s of sessions) {
        await sessionsCrud.update(s.id, { revoked: true, updated_at: new Date().toISOString() }).catch(() => {});
      }

      // resetear intentos en user
      await usersCrud.update(user.id, { failed_attempts: 0, lockout_until: null });

      // auditoría
      if (auditoriaCrud) {
        await auditoriaCrud.create({
          tabla: 'users',
          accion: 'RESET_PASSWORD_SUCCESS',
          registro_id: user.id,
          usuario_id: user.id,
          meta: JSON.stringify({ by: 'passcode', passcode_id: passcodeRecord.id }),
        }).catch(() => {});
      }
    }

    // 7) Enviar notificación por correo
    try {
      await sendMailNotification({
        to: user.email,
        subject: 'Tu contraseña ha sido actualizada',
        html: `<p>Hola, se ha actualizado la contraseña de tu cuenta. Si no fuiste tú, contacta con soporte inmediatamente.</p>`,
      });
    } catch (e) {
      // no fallar el flujo por error de correo
      console.warn('Failed sending password change email', e);
    }

    return createSuccessResponse({ data: true });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 401,
      });
    }

    console.error('Advanced reset-password error:', error);

    // Si el error se debe a intentos fallidos aumentados, podemos manejar lockout aquí:
    try {
      // intentar incrementar failed_attempts y aplicar lockout si supera el umbral
      const { usersCrud } = await authCrudOperations();
      if (validated && validated.email) {
        const [u] = await usersCrud.findMany({ email: validated.email });
        if (u) {
          const attempts = (u.failed_attempts || 0) + 1;
          const updates: any = { failed_attempts: attempts };
          if (attempts >= MAX_FAILED_ATTEMPTS) {
            updates.lockout_until = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();
          }
          await usersCrud.update(u.id, updates).catch(() => {});
        }
      }
    } catch (e) {
      // swallow
    }

    return createErrorResponse({
      errorMessage: 'Server error, please try again later',
      status: 500,
    });
  }
}, false);
