import { useQuery } from "@tanstack/react-query";
import { getAdminShops } from "@/lib/functions/admin/shops";

// ============================================================================
// Query Keys
// ============================================================================

export const adminShopsKeys = {
  all: ["admin", "shops"] as const,
  lists: () => [...adminShopsKeys.all, "list"] as const,
  list: (params: any) => [...adminShopsKeys.lists(), params] as const,
};

// ============================================================================
// Get Shops Hook
// ============================================================================

export function useAdminShops(params?: {
  limit?: number;
  offset?: number;
  search?: string;
  status?: "pending" | "active" | "suspended";
  vendorId?: string;
  sortBy?: "createdAt" | "name" | "totalProducts" | "totalOrders";
  sortDirection?: "asc" | "desc";
}) {
  return useQuery({
    queryKey: adminShopsKeys.list(params || {}),
    queryFn: () => getAdminShops({ data: params || {} }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============================================================================
// Get All Shops (for dropdown)
// ============================================================================

export function useAdminShopsForSelect() {
  return useQuery({
    queryKey: adminShopsKeys.list({ limit: 1000 }),
    queryFn: () => getAdminShops({ data: { limit: 1000, offset: 0 } }),
    staleTime: 1000 * 60 * 10, // 10 minutes
    select: (data) => data.data.map((shop) => ({
      value: shop.id,
      label: shop.name,
    })),
  });
}
