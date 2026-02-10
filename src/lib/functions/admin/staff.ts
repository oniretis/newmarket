/**
 * Staff Functions
 *
 * Server-side functions for managing staff members in the marketplace.
 */

import { db } from "@/lib/db";
import { staff } from "@/lib/db/schema/staff-schema";
import { user } from "@/lib/db/schema/auth-schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { Staff, NewStaff } from "@/lib/db/schema/staff-schema";

/**
 * Get all staff members with user information
 */
export async function getAllStaff(): Promise<Array<(Omit<Staff, 'joinedDate'> & { name: string | null; email: string | null; joinedDate: string })>> {
  const result = await db
    .select({
      id: staff.id,
      userId: staff.userId,
      role: staff.role,
      status: staff.status,
      joinedDate: staff.joinedDate,
      avatar: staff.avatar,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
      name: user.name,
      email: user.email,
    })
    .from(staff)
    .leftJoin(user, eq(staff.userId, user.id))
    .orderBy(desc(staff.createdAt));

  return result.map(item => ({
    ...item,
    joinedDate: item.joinedDate.toISOString(),
  }));
}

/**
 * Get staff member by ID
 */
export async function getStaffById(id: string): Promise<(Omit<Staff, 'joinedDate'> & { name: string | null; email: string | null; joinedDate: string }) | null> {
  const result = await db
    .select({
      id: staff.id,
      userId: staff.userId,
      role: staff.role,
      status: staff.status,
      joinedDate: staff.joinedDate,
      avatar: staff.avatar,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
      name: user.name,
      email: user.email,
    })
    .from(staff)
    .leftJoin(user, eq(staff.userId, user.id))
    .where(eq(staff.id, id))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const staffMember = result[0];
  return {
    ...staffMember,
    joinedDate: staffMember.joinedDate.toISOString(),
  };
}

/**
 * Create a new staff member
 */
export async function createStaff(data: Omit<NewStaff, "id" | "createdAt" | "updatedAt">): Promise<Staff> {
  const newStaff: NewStaff = {
    ...data,
    id: nanoid(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.insert(staff).values(newStaff).returning();
  return result[0];
}

/**
 * Update staff member
 */
export async function updateStaff(
  id: string,
  data: Partial<Omit<NewStaff, "id" | "createdAt" | "updatedAt">>
): Promise<Staff | null> {
  const result = await db
    .update(staff)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(staff.id, id))
    .returning();

  return result[0] || null;
}

/**
 * Delete staff member
 */
export async function deleteStaff(id: string): Promise<boolean> {
  const result = await db.delete(staff).where(eq(staff.id, id));
  return result.rowCount > 0;
}

/**
 * Get staff by user ID
 */
export async function getStaffByUserId(userId: string): Promise<Staff | null> {
  const result = await db.select().from(staff).where(eq(staff.userId, userId)).limit(1);
  return result[0] || null;
}

/**
 * Update staff status
 */
export async function updateStaffStatus(id: string, status: "active" | "invited" | "inactive"): Promise<Staff | null> {
  return updateStaff(id, { status });
}

/**
 * Update staff role
 */
export async function updateStaffRole(id: string, role: "admin" | "manager" | "staff"): Promise<Staff | null> {
  return updateStaff(id, { role });
}
