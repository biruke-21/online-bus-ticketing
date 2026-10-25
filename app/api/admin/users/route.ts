
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-auth";
import { NextResponse } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
function isValidRole(value: unknown): value is UserRole {
  return value === "ADMIN" || value === "PASSENGER";
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

/**
 * Safely extracts a Prisma error code.
 */
function getPrismaErrorCode(error: unknown): string | null {
  if (!(error instanceof Error)) {
    return null;
  }

  if (
    error.constructor.name !== "PrismaClientKnownRequestError"
  ) {
    return null;
  }

  const possibleError = error as Error & {
    code?: unknown;
  };

  return typeof possibleError.code === "string"
    ? possibleError.code
    : null;
}

/**
 * GET /api/admin/users
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAdminApi();

    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() ?? "";
    const roleParam = searchParams.get("role");
    const statusParam = searchParams.get("status");

    const requestedPage = Number(searchParams.get("page") ?? "1");
    const requestedLimit = Number(searchParams.get("limit") ?? "10");

    const page =
      Number.isInteger(requestedPage) && requestedPage > 0
        ? requestedPage
        : 1;

    const limit =
      Number.isInteger(requestedLimit) && requestedLimit > 0
        ? Math.min(requestedLimit, 100)
        : 10;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          phone: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    if (roleParam === "ADMIN" || roleParam === "PASSENGER") {
      where.role = roleParam;
    }

    if (statusParam === "active") {
      where.isActive = true;
    } else if (statusParam === "inactive") {
      where.isActive = false;
    }

    const [
      users,
      filteredTotal,
      totalUsers,
      activeUsers,
      inactiveUsers,
      admins,
    ] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),

      db.user.count({ where }),
      db.user.count(),
      db.user.count({ where: { isActive: true } }),
      db.user.count({ where: { isActive: false } }),
      db.user.count({
        where: {
          role: "ADMIN",
          isActive: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total: filteredTotal,
        totalPages: Math.ceil(filteredTotal / limit),
      },
      stats: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        admins,
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/admin/users failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve users.",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/admin/users
 */
export async function PUT(request: Request) {
  try {
    const auth = await requireAdminApi();

    if (!auth.authorized) {
      return auth.response;
    }

    const body: unknown = await request.json();

    if (!isValidObject(body)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request body.",
        },
        { status: 400 },
      );
    }

    const { id, name, email, phone, role, isActive } = body;

    if (typeof id !== "string" || !id.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "A valid user ID is required.",
        },
        { status: 400 },
      );
    }

    const userId = id.trim();
    const updateData: Prisma.UserUpdateInput = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "Name must be a non-empty string.",
          },
          { status: 400 },
        );
      }

      updateData.name = name.trim();
    }

    if (email !== undefined) {
      if (
        typeof email !== "string" ||
        !isValidEmail(email.trim())
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "A valid email address is required.",
          },
          { status: 400 },
        );
      }

      updateData.email = email.trim().toLowerCase();
    }

    if (phone !== undefined) {
      if (phone !== null && typeof phone !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "Phone must be a string or null.",
          },
          { status: 400 },
        );
      }

      updateData.phone =
        typeof phone === "string"
          ? phone.trim() || null
          : null;
    }

    if (role !== undefined) {
      if (!isValidRole(role)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid user role.",
          },
          { status: 400 },
        );
      }

      updateData.role = role;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            message: "isActive must be true or false.",
          },
          { status: 400 },
        );
      }

      updateData.isActive = isActive;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No valid fields were provided to update.",
        },
        { status: 400 },
      );
    }

    if (
      userId === auth.session.userId &&
      (updateData.role === "PASSENGER" ||
        updateData.isActive === false)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You cannot remove your own administrator access or deactivate your own account.",
        },
        { status: 400 },
      );
    }

    const existingUser = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 },
      );
    }

    const removesAdminAccess =
      existingUser.role === "ADMIN" &&
      existingUser.isActive &&
      (updateData.role === "PASSENGER" ||
        updateData.isActive === false);

    if (removesAdminAccess) {
      const activeAdminCount = await db.user.count({
        where: {
          role: "ADMIN",
          isActive: true,
        },
      });

      if (activeAdminCount <= 1) {
        return NextResponse.json(
          {
            success: false,
            message:
              "You cannot deactivate or demote the last active administrator.",
          },
          { status: 400 },
        );
      }
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User updated successfully.",
      user: updatedUser,
    });
  } catch (error: unknown) {
    console.error("PUT /api/admin/users failed:", error);

    const code = getPrismaErrorCode(error);

    if (code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          message: "That email address is already in use.",
        },
        { status: 409 },
      );
    }

    if (code === "P2025") {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to update user.",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/users?id=USER_ID
 */
export async function DELETE(request: Request) {
  try {
    const auth = await requireAdminApi();

    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || !id.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "A user ID is required.",
        },
        { status: 400 },
      );
    }

    const userId = id.trim();

    if (userId === auth.session.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "You cannot delete your own account.",
        },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        isActive: true,
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 },
      );
    }

    if (user._count.bookings > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "This user has bookings and cannot be deleted.",
        },
        { status: 409 },
      );
    }

    if (user.role === "ADMIN" && user.isActive) {
      const activeAdminCount = await db.user.count({
        where: {
          role: "ADMIN",
          isActive: true,
        },
      });

      if (activeAdminCount <= 1) {
        return NextResponse.json(
          {
            success: false,
            message:
              "You cannot delete the last active administrator.",
          },
          { status: 400 },
        );
      }
    }

    await db.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error: unknown) {
    console.error("DELETE /api/admin/users failed:", error);

    const code = getPrismaErrorCode(error);

    if (code === "P2025") {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete user.",
      },
      { status: 500 },
    );
  }
}
