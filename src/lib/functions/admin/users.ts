import { createServerFn } from "@tanstack/react-start";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema/auth-schema";
import { eq, desc, count } from "drizzle-orm";
import { adminMiddleware } from "@/lib/middleware/admin";
import { z } from "zod";

export interface UserWithStats {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  totalOrders: number;
  totalSpent: string;
  status: "active" | "inactive" | "suspended";
  createdAt: string;
}

/**
 * Fetch all users with their statistics
 */
export const getUsersWithStats = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async (): Promise<UserWithStats[]> => {
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        createdAt: user.createdAt,
        banned: user.banned,
        banReason: user.banReason,
        banExpires: user.banExpires,
      })
      .from(user)
      .orderBy(desc(user.createdAt));

    // Transform the data to match UserWithStats interface
    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.image || undefined,
      totalOrders: 0, // This should be calculated from orders table when available
      totalSpent: "$0.00", // This should be calculated from orders when available
      status: getUserStatus(u),
      createdAt: u.createdAt.toISOString().split("T")[0],
    }));
  });

/**
 * Get user status based on ban information
 */
function getUserStatus(userData: {
  banned: boolean | null;
  banReason: string | null;
  banExpires: Date | null;
}): "active" | "inactive" | "suspended" {
  if (userData.banned) {
    if (userData.banExpires && userData.banExpires > new Date()) {
      return "suspended";
    }
    return "suspended";
  }
  return "active";
}

/**
 * Update user status
 */
export const updateUserStatus = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(
    z.object({
      userId: z.string(),
      status: z.enum(["active", "inactive", "suspended"]),
      banReason: z.string().optional(),
    })
  )
  .handler(async ({ data }) => {
    const { userId, status, banReason } = data;

    const updateData: any = {
      banned: status === "suspended",
      banReason: status === "suspended" ? banReason || null : null,
      banExpires: status === "suspended" ? null : null,
    };

    await db
      .update(user)
      .set(updateData)
      .where(eq(user.id, userId));

    return { success: true };
  });

/**
 * Delete user
 */
export const deleteUser = createServerFn({ method: "DELETE" })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ userId: z.string() }))
  .handler(async ({ data }) => {
    const { userId } = data;

    await db.delete(user).where(eq(user.id, userId));

    return { success: true };
  });
