import { NextRequest } from 'next/server';
import {
  requestMiddleware,
  validateRequestBody,
  sendVerificationEmail,
} from '@/lib/api-utils';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/create-response';
import {
  generateVerificationCode,
  hashString,
} from '@/lib/server-utils';
import { authCrudOperations } from '@/lib/auth';
import { z } from 'zod';

const sendVerificationSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  type: z.enum(['register', 'reset-password']),
});

// CONFIGURACIÓN
const CODE_VALIDITY_MS = 5 * 60 * 1000; // 5 minutos
const SEND_COOLDOWN_MS = 60 * 1000; // 1 minuto entre envíos

export const POST = requestMiddleware(async (request: NextRequest) => {
  try {
    const body = await validateRequestBody(request);
    const validated = sendVerificationSchema.parse(body);

    const {
      usersCrud,
      userPasscodeCrud,
      auditoriaCrud, // opcional
    } = await authCrudOperations();

    const email = validated.email;

    // 1) VALIDACIONES SEGÚN TIPO
    if (validated.type === 'register') {
      const existing = await usersCrud.findMany({ email });
      if (existing?.length > 0) {
        return createErrorResponse({
          errorMessage: 'This email address has been registered',
          status: 409,
        });
      }
    }

    if (validated.type === 'reset-password') {
      const existing = await usersCrud.findMany({ email });
      if (!existing || existing.length === 0) {
        return createErrorResponse({
          errorMessage: 'This user is not registered',
          status: 400,
        });
      }
    }

    // 2) OBTENER ÚLTIMO PASSCODE PARA CONTROL DE ABUSO
    const [lastCode] = await userPasscodeCrud.findMany(
      { pass_object: email },
      { orderBy: { column: 'id', direction: 'desc' }, limit: 1 }
    );

    if (lastCode) {
      const lastSentTime = new Date(lastCode.created_at).getTime();
      const now = Date.now();

      // prevenir spam de códigos
      if (now - lastSentTime < SEND_COOLDOWN_MS) {
        return createErrorResponse({
          errorMessage: 'Please wait before requesting another code',
          status: 429,
        });
      }
    }

    // 3) GENERAR NUEVO CÓDIGO SEGURO
    const rawCode = generateVerificationCode();
    const hashedCode = await hashString(rawCode);

    // 4) REVOCAR CÓDIGOS ANTERIORES
    if (lastCode && !lastCode.revoked) {
      await userPasscodeCrud.update(lastCode.id, { revoked: true }).catch(() => {});
    }

    // 5) Crear nuevo passcode
    const validUntil = new Date(Date.now() + CODE_VALIDITY_MS).toISOString();

    await userPasscodeCrud.create({
      pass_object: email,
      passcode: hashedCode,
      valid_until: validUntil,
      revoked: false,
      failed_attempts: 0,
      type: validated.type,
    });

    // 6) ENVIAR EMAIL
    const emailSent = await sendVerificationEmail(email, rawCode);
    if (!emailSent) {
      return createErrorResponse({
        errorMessage: 'Failed to send the email. Please try again later',
        status: 500,
      });
    }

    // 7) AUDITORIA OPCIONAL
    try {
      if (auditoriaCrud) {
        await auditoriaCrud.create({
          tabla: 'user_passcodes',
          accion: 'SEND_VERIFICATION_CODE',
          usuario_id: null,
          registro_id: null,
          meta: JSON.stringify({
            email,
            type: validated.type,
          }),
        });
      }
    } catch (_) {}

    return createSuccessResponse({ data: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }

    console.error('send-verification error:', error);

    return createErrorResponse({
      errorMessage: 'Failed to send the email. Please try again later',
      status: 500,
    });
  }
}, false);
