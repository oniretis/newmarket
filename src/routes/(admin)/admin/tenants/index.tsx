import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import AdminTenantsTemplate from "@/components/templates/admin/tenants/admin-tenants-template";
import { getTenantsWithStats } from "@/lib/functions/admin/tenants";
import type { AdminTenant } from "@/types/tenant";

export const Route = createFileRoute("/(admin)/admin/tenants/")({
  component: AdminTenantsPage,
});

function AdminTenantsPage() {
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTenants() {
      try {
        setLoading(true);
        const data = await getTenantsWithStats();
        setTenants(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch tenants");
        console.error("Error fetching tenants:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTenants();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading tenants...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return <AdminTenantsTemplate tenants={tenants} />;
}
