import { NextRequest } from "next/server";
import { createErrorResponse, createAuthResponse } from "@/lib/create-response";
import { getDevUsers } from "@/lib/dev-users";
import { z } from "zod";

export const runtime = "edge";

// Validación del cuerpo del request
const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(1, "Please provide the password."),
});

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

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
      return createErrorResponse({
        errorMessage: "Invalid email or password",
        status: 401,
      });
    }

    // Tokens mock para desarrollo
    const timestamp = Date.now();
    const accessToken = `mock_access_${timestamp}_${user.email}`;
    const refreshToken = `mock_refresh_${timestamp}_${user.email}`;

    return createAuthResponse({
      accessToken,
      refreshToken,
      user: {
        id: testUsers.indexOf(user) + 1,
        email: user.email,
        rol_sistema: user.rol_sistema,
      },
    });

  } catch (error) {
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
