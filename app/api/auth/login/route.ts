import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
try {
const body: unknown = await request.json();

if (
  typeof body !== "object" ||
  body === null ||
  !("email" in body) ||
  !("password" in body) ||
  typeof body.email !== "string" ||
  typeof body.password !== "string"
) {
  return NextResponse.json(
    { success: false, message: "Please enter a valid email and password." },
    { status: 400 },
  );
}

const email = body.email.trim().toLowerCase();
const password = body.password;

if (!email || !password || password.length > 256) {
  return NextResponse.json(
    { success: false, message: "Please enter a valid email and password." },
    { status: 400 },
  );
}

const user = await db.user.findUnique({
  where: { email },
  select: {
    id: true,
    email: true,
    passwordHash: true,
    role: true,
    isActive: true,
  },
});

if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
  return NextResponse.json(
    { success: false, message: "Invalid email or password." },
    { status: 401 },
  );
}

if (!user.isActive) {
  return NextResponse.json(
    { success: false, message: "Your account is inactive. Please contact the administrator." },
    { status: 403 },
  );
}

await createSession({
  userId: user.id,
  role: user.role,
});

return NextResponse.json({
  success: true,
  message: "Login successful.",
  user: {
    id: user.id,
    email: user.email,
    role: user.role,
  },
  redirectTo: user.role === "ADMIN" ? "/admin" : "/",
});

} catch (error) {
console.error("Login API error:", error);

return NextResponse.json(
  { success: false, message: "Unable to log in right now. Please try again." },
  { status: 500 },
);

}
}
