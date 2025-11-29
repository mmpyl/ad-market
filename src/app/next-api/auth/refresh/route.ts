import { NextRequest } from "next/server";
import { requestMiddleware, getCookies } from "@/lib/api-utils";
import { createErrorResponse, createAuthResponse } from "@/lib/create-response";
import { generateToken, authCrudOperations } from "@/lib/auth";
import { generateRandomString, pbkdf2Hash } from "@/lib/server-utils";
import { REFRESH_TOKEN_EXPIRE_TIME, AUTH_CODE } from "@/constants/auth";

export const POST = requestMiddleware(async (request: NextRequest) => {
  try {
    const [refreshToken] = getCookies(request, ["refresh-token"]);

    if (!refreshToken) {
      return createErrorResponse({
        errorCode: AUTH_CODE.REFRESH_TOKEN_MISSING,
        errorMessage: "Refresh token is missing",
        status: 401,
      });
    }

    const hashedRefreshToken = await pbkdf2Hash(refreshToken);
    const { usersCrud, sessionsCrud, refreshTokensCrud } = await authCrudOperations();

    // Buscar refresh token válido
    const records = await refreshTokensCrud.findMany({
      token: hashedRefreshToken,
      revoked: false,
    });

    const record = records?.[0];

    if (
      !record ||
      new Date(record.expires_at).getTime() <= Date.now()
    ) {
      return createErrorResponse({
        errorCode: AUTH_CODE.REFRESH_TOKEN_EXPIRED,
        errorMessage: "Refresh token is expired or invalid",
        status: 401,
      });
    }

    // Revocar token viejo
    await refreshTokensCrud.update(record.id, { revoked: true });

    // Crear nuevo refresh token
    const newRefreshToken = await generateRandomString();
    const hashedNewRefreshToken = await pbkdf2Hash(newRefreshToken);

    await refreshTokensCrud.create({
      token: hashedNewRefreshToken,
      user_id: record.user_id,
      session_id: record.session_id,
      expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRE_TIME * 1000).toISOString(),
    });

    // Actualizar sesión
    await sessionsCrud.update(record.session_id, {
      refresh_at: new Date().toISOString(),
    });

    const user = await usersCrud.findById(record.user_id);

    const accessToken = await generateToken({
      sub: user.id,
      role: user.role,
      email: user.email,
    });

    return createAuthResponse({
      accessToken,
      refreshToken: newRefreshToken,
    });

  } catch (error) {
    return createErrorResponse({
      errorMessage: "Failed to refresh the token",
      status: 500,
    });
  }
}, false);
