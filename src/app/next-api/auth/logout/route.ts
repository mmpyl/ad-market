import { NextRequest } from "next/server";
import { requestMiddleware } from "@/lib/api-utils";
import { authCrudOperations } from "@/lib/auth";
import { pbkdf2Hash } from "@/lib/server-utils";
import { createLogoutResponse } from "@/lib/create-response";

export const POST = requestMiddleware(
  async (request: NextRequest, context: { token?: string; payload?: any }) => {
    try {
      const { refreshTokensCrud, sessionsCrud } = await authCrudOperations();
      const userId = context.payload?.sub;

      if (!userId) {
        // No hay usuario autenticado — igual devolvemos logout
        return createLogoutResponse();
      }

      const refreshToken = request.cookies.get("refresh-token")?.value;
      if (!refreshToken) {
        return createLogoutResponse();
      }

      // Hash del refresh token que envió el cliente
      const hashedRefreshToken = await pbkdf2Hash(refreshToken);

      // Buscar tokens vigentes asociados
      const records = await refreshTokensCrud.findMany({
        token: hashedRefreshToken,
        revoked: false,
      });

      if (records.length > 0) {
        // Revocar todos los tokens coincidentes
        for (const record of records) {
          await refreshTokensCrud.update(record.id, { revoked: true });

          // Actualizar sesión asociada (opcional)
          if (record.session_id) {
            await sessionsCrud.update(record.session_id, {
              updated_at: new Date().toISOString(),
            });
          }
        }
      }

      return createLogoutResponse();
    } catch {
      // En errores también devolvemos logout (sin revelar detalles)
      return createLogoutResponse();
    }
  },
  false
);
