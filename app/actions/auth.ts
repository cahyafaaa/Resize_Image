"use server";

import { compare, hash } from "bcryptjs";
import { redirect } from "next/navigation";
import {
  assertSameOriginRequest,
  createSession,
  destroyCurrentSession,
} from "../lib/auth";
import { prisma } from "../lib/prisma";
import type { AuthFormState } from "../lib/validation";
import {
  normalizeEmail,
  validateLoginInput,
  validateRegisterInput,
} from "../lib/validation";

const genericLoginError = "Invalid email or password.";

export async function registerAction(
  _previousState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  try {
    await assertSameOriginRequest();

    const validation = validateRegisterInput(formData);

    if (!validation.isValid) {
      return {
        message: "Please fix the highlighted fields.",
        fieldErrors: validation.fieldErrors,
      };
    }

    const { name, email, password } = validation.data;
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return {
        message: "An account with this email already exists.",
        fieldErrors: {
          email: "Use a different email or log in.",
        },
      };
    }

    const passwordHash = await hash(password, 12);
    await prisma.user.create({
      data: {
        name,
        email: normalizeEmail(email),
        passwordHash,
      },
      select: {
        id: true,
      },
    });
  } catch (error) {
    console.error("Registration failed", error);

    return {
      message: "Unable to create your account right now.",
    };
  }

  redirect("/login?registered=1");
}

export async function loginAction(
  _previousState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  try {
    await assertSameOriginRequest();

    const validation = validateLoginInput(formData);

    if (!validation.isValid) {
      return {
        message: "Please fix the highlighted fields.",
        fieldErrors: validation.fieldErrors,
      };
    }

    const { email, password } = validation.data;
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user?.passwordHash) {
      return { message: genericLoginError };
    }

    const passwordMatches = await compare(password, user.passwordHash);

    if (!passwordMatches) {
      return { message: genericLoginError };
    }

    await createSession(user.id);
  } catch (error) {
    console.error("Login failed", error);

    return {
      message: "Unable to log in right now.",
    };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await assertSameOriginRequest();
  await destroyCurrentSession();
  redirect("/login");
}
