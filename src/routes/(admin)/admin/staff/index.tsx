import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import AdminStaffTemplate from "@/components/templates/admin/admin-staff-template";
import { getAllStaffFn, createStaffFn, deleteStaffFn } from "@/lib/functions/admin/staff-server";
import type { Staff } from "@/types/staff";

type StaffWithUser = Staff & { 
  name: string | null; 
  email: string | null; 
};

export const Route = createFileRoute("/(admin)/admin/staff/")({
  component: AdminStaffPage,
});

function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const result = await getAllStaffFn();
      if (result.success) {
        setStaff(result.data);
      } else {
        console.error("Failed to load staff:", result.error);
      }
    } catch (error) {
      console.error("Error loading staff:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (data: Omit<Staff, "id" | "joinedDate">) => {
    try {
      const result = await createStaffFn({
        userId: data.userId,
        role: data.role,
        status: data.status,
        avatar: data.avatar,
      });
      
      if (result.success) {
        await loadStaff(); // Reload the staff list
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error adding staff:", error);
      throw error;
    }
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      const result = await deleteStaffFn({ id });
      if (result.success) {
        await loadStaff(); // Reload the staff list
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error deleting staff:", error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading staff...</div>
      </div>
    );
  }

  return (
    <AdminStaffTemplate
      staff={staff}
      onAddStaff={handleAddStaff}
      onDeleteStaff={handleDeleteStaff}
    />
  );
}
