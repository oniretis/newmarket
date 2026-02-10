import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import AdminUsersTemplate from "@/components/templates/admin/admin-users-template";
import type { User, UserFormValues } from "@/types/users";
import { getUsersWithStats, updateUserStatus, deleteUser } from "@/lib/functions/admin/users";

export const Route = createFileRoute("/(admin)/admin/users/")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await getUsersWithStats();
        const formattedUsers: User[] = usersData.map((user) => ({
          ...user,
          createdAt: new Date(user.createdAt),
        }));
        setUsers(formattedUsers);
      } catch (error) {
        console.error("Failed to load users:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleAddUser = (data: UserFormValues) => {
    // This would need a server function to create users
    // For now, just refresh the users list
    window.location.reload();
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteUser({ userId: id });
      setUsers(users.filter((user) => user.id !== id));
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <AdminUsersTemplate
      users={users}
      onAddUser={handleAddUser}
      onDeleteUser={handleDeleteUser}
    />
  );
}
