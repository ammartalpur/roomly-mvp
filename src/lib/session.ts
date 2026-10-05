import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "roomly_session";

export function isSessionConfigured() {
  const value = process.env.SESSION_SECRET;
  return process.env.NODE_ENV !== "production" || Boolean(value && value.length >= 32);
}

function sessionSecret() {
  const value = process.env.SESSION_SECRET;
  if (!isSessionConfigured()) {
    throw new Error("SESSION_SECRET must be configured with at least 32 characters in production");
  }
  return new TextEncoder().encode(value ?? "roomly-development-secret-change-before-production");
}

type SessionPayload = { userId: string; expiresAt: string };

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = await new SignJWT({ userId, expiresAt: expiresAt.toISOString() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(sessionSecret());

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, sessionSecret(), { algorithms: ["HS256"] });
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  (await cookies()).delete(COOKIE_NAME);
}
