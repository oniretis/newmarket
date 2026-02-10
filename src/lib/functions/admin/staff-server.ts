import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getAllStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  updateStaffStatus,
  updateStaffRole,
} from "./staff";
import { adminMiddleware } from "@/lib/middleware/admin";

// Get all staff
export const getAllStaffFn = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async () => {
    try {
      const staff = await getAllStaff();
      return { success: true, data: staff };
    } catch (error) {
      console.error("Error fetching staff:", error);
      return { success: false, error: "Failed to fetch staff" };
    }
  });

// Create staff
const createStaffSchema = z.object({
  userId: z.string(),
  role: z.enum(["admin", "manager", "staff"]),
  status: z.enum(["active", "invited", "inactive"]),
  avatar: z.string().optional(),
});

export const createStaffFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(createStaffSchema)
  .handler(async ({ data }) => {
    try {
      const newStaff = await createStaff(data);
      return { success: true, data: newStaff };
    } catch (error) {
      console.error("Error creating staff:", error);
      return { success: false, error: "Failed to create staff" };
    }
  });

// Update staff
const updateStaffSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  role: z.enum(["admin", "manager", "staff"]).optional(),
  status: z.enum(["active", "invited", "inactive"]).optional(),
  avatar: z.string().optional(),
});

export const updateStaffFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(updateStaffSchema)
  .handler(async ({ data }) => {
    try {
      const { id, ...updateData } = data;
      const updatedStaff = await updateStaff(id, updateData);
      if (!updatedStaff) {
        return { success: false, error: "Staff not found" };
      }
      return { success: true, data: updatedStaff };
    } catch (error) {
      console.error("Error updating staff:", error);
      return { success: false, error: "Failed to update staff" };
    }
  });

// Delete staff
const deleteStaffSchema = z.object({
  id: z.string(),
});

export const deleteStaffFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(deleteStaffSchema)
  .handler(async ({ data }) => {
    try {
      const success = await deleteStaff(data.id);
      if (!success) {
        return { success: false, error: "Staff not found" };
      }
      return { success: true };
    } catch (error) {
      console.error("Error deleting staff:", error);
      return { success: false, error: "Failed to delete staff" };
    }
  });

// Update staff status
const updateStaffStatusSchema = z.object({
  id: z.string(),
  status: z.enum(["active", "invited", "inactive"]),
});

export const updateStaffStatusFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(updateStaffStatusSchema)
  .handler(async ({ data }) => {
    try {
      const updatedStaff = await updateStaffStatus(data.id, data.status);
      if (!updatedStaff) {
        return { success: false, error: "Staff not found" };
      }
      return { success: true, data: updatedStaff };
    } catch (error) {
      console.error("Error updating staff status:", error);
      return { success: false, error: "Failed to update staff status" };
    }
  });

// Update staff role
const updateStaffRoleSchema = z.object({
  id: z.string(),
  role: z.enum(["admin", "manager", "staff"]),
});

export const updateStaffRoleFn = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(updateStaffRoleSchema)
  .handler(async ({ data }) => {
    try {
      const updatedStaff = await updateStaffRole(data.id, data.role);
      if (!updatedStaff) {
        return { success: false, error: "Staff not found" };
      }
      return { success: true, data: updatedStaff };
    } catch (error) {
      console.error("Error updating staff role:", error);
      return { success: false, error: "Failed to update staff role" };
    }
  });
