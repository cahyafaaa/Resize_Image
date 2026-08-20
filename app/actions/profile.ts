"use server";

import { compare, hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { normalizeEmail } from "../lib/validation";

export interface ProfileActionResult {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
}

export async function updateProfileInfoAction(
  formData: FormData
): Promise<ProfileActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: "Please log in first." };
    }

    const name = formData.get("name")?.toString().trim() || "";
    const emailRaw = formData.get("email")?.toString().trim() || "";
    const email = normalizeEmail(emailRaw);

    const fieldErrors: Record<string, string> = {};

    if (name.length < 2 || name.length > 80) {
      fieldErrors.name = "Name must be between 2 and 80 characters.";
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email) || email.length > 254) {
      fieldErrors.email = "Please enter a valid email address.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        success: false,
        message: "Please correct the highlighted fields.",
        fieldErrors,
      };
    }

    // If email changed, verify it's not taken by another user
    if (email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (existingUser && existingUser.id !== user.id) {
        return {
          success: false,
          message: "An account with this email address already exists.",
          fieldErrors: { email: "Email is already in use by another account." },
        };
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        email,
      },
    });

    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Profile updated successfully!",
    };
  } catch (error: any) {
    console.error("Failed to update profile info:", error);
    return {
      success: false,
      message: error?.message || "Failed to update profile.",
    };
  }
}

export async function updatePasswordAction(
  formData: FormData
): Promise<ProfileActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, message: "Please log in first." };
    }

    const currentPassword = formData.get("currentPassword")?.toString() || "";
    const newPassword = formData.get("newPassword")?.toString() || "";
    const confirmPassword = formData.get("confirmPassword")?.toString() || "";

    const fieldErrors: Record<string, string> = {};

    if (!currentPassword) {
      fieldErrors.currentPassword = "Enter your current password.";
    }

    if (newPassword.length < 8 || newPassword.length > 128) {
      fieldErrors.newPassword = "New password must be at least 8 characters.";
    }

    if (newPassword !== confirmPassword) {
      fieldErrors.confirmPassword = "Password confirmation does not match.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      return {
        success: false,
        message: "Please fix the highlighted fields.",
        fieldErrors,
      };
    }

    // Get user from database with passwordHash
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (dbUser?.passwordHash) {
      const passwordValid = await compare(currentPassword, dbUser.passwordHash);
      if (!passwordValid) {
        return {
          success: false,
          message: "Current password is incorrect.",
          fieldErrors: { currentPassword: "Incorrect password." },
        };
      }
    }

    const newPasswordHash = await hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    return {
      success: true,
      message: "Password changed successfully!",
    };
  } catch (error: any) {
    console.error("Failed to update password:", error);
    return {
      success: false,
      message: error?.message || "Failed to update password.",
    };
  }
}
