import { randomBytes, createHash } from "crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

const SESSION_COOKIE_NAME = "resize_image_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
};

const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function assertSameOriginRequest() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin");
  const host = headerStore.get("host");
  const referer = headerStore.get("referer");

  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === host) return;
    } catch {
      // Ignore URL parse error
    }
  }

  if (referer && host) {
    try {
      const refererHost = new URL(referer).host;
      if (refererHost === host) return;
    } catch {
      // Ignore URL parse error
    }
  }

  const forwardedProto = headerStore.get("x-forwarded-proto");
  const protocol = forwardedProto?.split(",")[0]?.trim() || "https";
  const expectedOrigin = process.env.APP_ORIGIN || `${protocol}://${host}`;

  if (origin && origin === expectedOrigin) {
    return;
  }

  if (origin || referer) {
    throw new Error("Invalid request origin");
  }
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    ...sessionCookieOptions,
    expires: expiresAt,
  });
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      tokenHash: hashSessionToken(token),
    },
    select: {
      expiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (!session || session.expiresAt <= new Date()) {
    return null;
  }

  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: {
        tokenHash: hashSessionToken(token),
      },
    });
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions,
    maxAge: 0,
    expires: new Date(0),
  });
}
