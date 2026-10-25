import "server-only";

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "busgo_session";

const secretValue = process.env.SESSION_SECRET;

if (!secretValue || secretValue.length < 32) {
  throw new Error(
    "SESSION_SECRET must be configured with at least 32 characters.",
  );
}

const secret = new TextEncoder().encode(secretValue);

export type SessionUser = {
  userId: string;
  role: "ADMIN" | "PASSENGER";
};

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.userId)
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(secret);

  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.sub !== "string" ||
      (payload.role !== "ADMIN" && payload.role !== "PASSENGER")
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}