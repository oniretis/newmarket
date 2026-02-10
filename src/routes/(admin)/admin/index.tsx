import { createFileRoute } from "@tanstack/react-router";
import { Building2, DollarSign, ShoppingBag, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats } from "@/lib/functions/admin/dashboard-stats";
import { useQuery } from "@tanstack/react-query";
import AdminDashboardChart from "@/components/containers/admin/admin-dashboard-chart-component";
import AdminRecentActivity from "@/components/containers/admin/admin-recent-activity";

export const Route = createFileRoute("/(admin)/admin/")({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: () => getDashboardStats(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-bold text-3xl tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground">
            Platform-wide overview and statistics
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-bold text-3xl tracking-tight">Admin Dashboard</h2>
          <p className="text-muted-foreground">
            Platform-wide overview and statistics
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Error loading dashboard data: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dashboardStats = [
    {
      title: "Total Tenants",
      value: stats?.totalTenants.toLocaleString() ?? "0",
      change: (stats?.tenantsChange ?? 0) > 0 ? `+${stats?.tenantsChange} new this month` : (stats?.tenantsChange ?? 0) < 0 ? `${stats?.tenantsChange} this month` : "No change",
      icon: Building2,
    },
    {
      title: "Total Users",
      value: stats?.totalUsers.toLocaleString() ?? "0",
      change: (stats?.usersChange ?? 0) > 0 ? `+${stats?.usersChange} from last month` : (stats?.usersChange ?? 0) < 0 ? `${stats?.usersChange} from last month` : "No change",
      icon: Users,
    },
    {
      title: "Total Shops",
      value: stats?.totalShops.toLocaleString() ?? "0",
      change: (stats?.shopsChange ?? 0) > 0 ? `+${stats?.shopsChange} from last month` : (stats?.shopsChange ?? 0) < 0 ? `${stats?.shopsChange} from last month` : "No change",
      icon: ShoppingBag,
    },
    {
      title: "Total Products",
      value: stats?.totalProducts.toLocaleString() ?? "0",
      change: (stats?.productsChange ?? 0) > 0 ? `+${stats?.productsChange} from last month` : (stats?.productsChange ?? 0) < 0 ? `${stats?.productsChange} from last month` : "No change",
      icon: DollarSign,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-bold text-3xl tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Platform-wide overview and statistics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-medium text-sm">
                  {stat.title}
                </CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{stat.value}</div>
                <p className="text-muted-foreground text-xs">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <AdminDashboardChart />
        <AdminRecentActivity />
      </div>
    </div>
  );
}
