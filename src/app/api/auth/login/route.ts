import { NextRequest, NextResponse } from "next/server";
import { createErrorResponse } from "@/lib/create-response";
import { getDevUsers } from "@/lib/dev-users";
import { z } from "zod";

export const runtime = "edge";

// Validación del cuerpo del request
const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(1, "Please provide the password."),
});

export const POST = async (request: NextRequest) => {
  console.log('[Login Route] Request received'); // ✅ Debug
  
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    console.log('[Login Route] Attempting login for:', email); // ✅ Debug

    const testUsers = getDevUsers();

    if (testUsers.length === 0) {
      return createErrorResponse({
        errorMessage: "Test users not available in this environment",
        status: 403,
      });
    }

    const user = testUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      console.log('[Login Route] Invalid credentials'); // ✅ Debug
      return createErrorResponse({
        errorMessage: "Invalid email or password",
        status: 401,
      });
    }

    console.log('[Login Route] Valid credentials, creating tokens'); // ✅ Debug

    // Tokens mock para desarrollo
    const timestamp = Date.now();
    const accessToken = `mock_access_${timestamp}_${user.email}`;
    const refreshToken = `mock_refresh_${timestamp}_${user.email}`;

    // ✅ Crear la respuesta con los datos del usuario
    const userData = {
      id: testUsers.indexOf(user) + 1,
      email: user.email,
      rol_sistema: user.rol_sistema,
      nombre: user.nombre || user.email.split('@')[0],
    };

    const response = NextResponse.json({
      success: true,
      user: userData, // ✅ Retornar user directamente
      data: userData, // ✅ También en data para compatibilidad
    });

    // ✅ CRÍTICO: Guardar tokens como cookies
    response.cookies.set('access_token', accessToken, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15, // 15 minutos
      path: '/',
    });

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    });

    console.log('[Login Route] Cookies set, login successful'); // ✅ Debug

    return response;

  } catch (error) {
    console.error('[Login Route] Error:', error); // ✅ Debug
    
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 400,
      });
    }

    return createErrorResponse({
      errorMessage: "Login failed. Please try again later",
      status: 500,
    });
  }
};