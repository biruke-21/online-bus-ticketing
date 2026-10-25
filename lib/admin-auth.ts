
import "server-only";

import { NextResponse } from "next/server";
import { getSession, type SessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Verify that the current user:
 * 1. Has a valid session.
 * 2. Exists in the database.
 * 3. Has the ADMIN role in the database.
 * 4. Is currently active.
 */
export async function getAdminSession(): Promise<SessionUser | null> {
  try {
    const session = await getSession();

    if (!session) {
      return null;
    }

    // Always verify the user's current permissions in the database.
    const user = await db.user.findUnique({
      where: {
        id: session.userId,
      },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return null;
    }

    if (user.role !== "ADMIN" || !user.isActive) {
      return null;
    }

    return {
      userId: user.id,
      role: "ADMIN",
    };
  } catch (error) {
    console.error("Admin session verification failed:", error);
    return null;
  }
}

/**
 * Protect admin API endpoints.
 *
 * Returns an authorized session for an administrator.
 * Otherwise, returns an HTTP 401 response.
 */
export async function requireAdminApi(): Promise<
  | {
      authorized: true;
      session: SessionUser;
    }
  | {
      authorized: false;
      response: NextResponse;
    }
> {
  const session = await getAdminSession();

  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          message:
            "Unauthorized. Administrator access is required.",
        },
        {
          status: 401,
        },
      ),
    };
  }

  return {
    authorized: true,
    session,
  };
}
