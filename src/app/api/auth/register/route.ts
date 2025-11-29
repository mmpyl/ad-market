import { NextRequest } from 'next/server';
import { requestMiddleware, validateRequestBody } from '@/lib/api-utils';
import { createErrorResponse, createSuccessResponse } from '@/lib/create-response';
import { hashString, verifyHashString } from '@/lib/server-utils';
import { z } from 'zod';
import { authCrudOperations } from '@/lib/auth';
import { userRegisterCallback } from '@/lib/user-register';

const registerSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  passcode: z
    .string()
    .min(6, 'Verification code must be 6 digits')
    .max(6, 'Verification code must be 6 digits'),
});

export const POST = requestMiddleware(async (request: NextRequest) => {
  try {
    const body = await validateRequestBody(request);
    const validated = registerSchema.parse(body);

    const { usersCrud, userPasscodeCrud } = await authCrudOperations();

    // Check if user already exists
    const existing = await usersCrud.findMany({ email: validated.email });

    if (existing?.length > 0) {
      return createErrorResponse({
        errorMessage: 'User already registered',
        status: 409,
      });
    }

    // Fetch latest passcode entry
    const [passcodeRecord] = await userPasscodeCrud.findMany(
      { pass_object: validated.email },
      {
        orderBy: { column: 'id', direction: 'desc' },
      }
    );

    // Validate passcode record
    const isValidExpiration =
      passcodeRecord &&
      new Date(passcodeRecord.valid_until).getTime() > Date.now();

    if (
      !passcodeRecord ||
      !passcodeRecord.passcode ||
      passcodeRecord.revoked ||
      !isValidExpiration
    ) {
      return createErrorResponse({
        errorMessage: 'Invalid verification code',
        status: 401,
      });
    }

    const passcodeMatches = await verifyHashString(
      validated.passcode,
      passcodeRecord.passcode
    );

    if (!passcodeMatches) {
      return createErrorResponse({
        errorMessage: 'Invalid verification code',
        status: 401,
      });
    }

    // Hash password and create new user
    const hashedPassword = await hashString(validated.password);

    const newUser = await usersCrud.create({
      email: validated.email,
      password: hashedPassword,
    });

    // Allow custom extension logic
    await userRegisterCallback(newUser);

    // Revoke passcode
    await userPasscodeCrud.update(passcodeRecord.id, { revoked: true });

    return createSuccessResponse({ data: true });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse({
        errorMessage: error.errors[0].message,
        status: 401,
      });
    }

    return createErrorResponse({
      errorMessage: 'Registration failed, please try again later',
      status: 500,
    });
  }
}, false);
