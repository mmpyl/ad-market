import { NextRequest } from "next/server";
import { 
  requestMiddleware, 
  responseRedirect, 
  getRequestIp, 
  validateRequestBody 
} from "@/lib/api-utils";

import { createErrorResponse, createAuthResponse } from "@/lib/create-response";
import { generateToken, authCrudOperations, verifyToken } from "@/lib/auth";
import { generateRandomString, pbkdf2Hash } from "@/lib/server-utils";
import { REFRESH_TOKEN_EXPIRE_TIME } from "@/constants/auth";

import { z } from "zod";
import { userRegisterCallback } from "@/lib/user-register";

// Zod schema para validar body
const GoogleLoginSchema = z.object({
  access_token: z.string().min(10),
  callback_url: z.string().url()
});

export const POST = requestMiddleware(async (request: NextRequest) => {
  try {
    const ip = getRequestIp(request);
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Validación estricta del body
    const rawBody = await validateRequestBody(request);
    const parsed = GoogleLoginSchema.safeParse(rawBody);

    if (!parsed.success) {
      return createErrorResponse({
        errorMessage: parsed.error.errors[0].message,
        status: 400,
      });
    }

    const { access_token, callback_url } = parsed.data;

    // Seguridad: evitar open redirects
    const callbackUrl = new URL(callback_url);
    const allowedHost = process.env.NEXT_PUBLIC_APP_DOMAIN;

    if (!allowedHost || callbackUrl.host !== allowedHost) {
      return createErrorResponse({
        errorMessage: "Invalid callback domain",
        status: 400
      });
    }

    const loginUrl = new URL('/login', callbackUrl).href;

    const { usersCrud, sessionsCrud, refreshTokensCrud } =
      await authCrudOperations();

    const { valid, payload } = await verifyToken(access_token);

    if (!valid || !payload?.email) {
      return responseRedirect(loginUrl, callbackUrl.href);
    }

    // Buscar usuario por email
    let user = (await usersCrud.findMany({ email: payload.email }))?.[0];

    // Registrar usuario si no existe
    if (!user) {
      const userData = {
        email: payload.email,
        password: null,
        is_oauth: true,
        provider: "google"
      };

      user = await usersCrud.create(userData);

      // Hook extendido
      await userRegisterCallback(user);
    }

    // -------------------------------
    //     Generar Access Token
    // -------------------------------
    const accessToken = await generateToken({
      sub: user.id,
      role: user.role,
      email: user.email,
    });

    // -------------------------------
    //     Crear Refresh Token
    // -------------------------------
    const refreshToken = await generateRandomString();
    const hashedRefreshToken = await pbkdf2Hash(refreshToken);

    const session = await sessionsCrud.create({
      user_id: user.id,
      ip,
      user_agent: userAgent,
    });

    await refreshTokensCrud.create({
      user_id: user.id,
      session_id: session.id,
      token: hashedRefreshToken,
      expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRE_TIME * 1000).toISOString(),
    });

    return createAuthResponse({ accessToken, refreshToken });

  } catch (error) {

    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }

    console.error("Google Login error:", error);

    return createErrorResponse({
      errorMessage: "Login failed. Please try again later",
      status: 500,
    });
  }
}, false);
