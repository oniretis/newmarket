import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  toggleAdminCategoryStatus,
  toggleAdminCategoryFeatured,
} from "@/lib/functions/admin/categories";
import type { NormalizedCategory, CategoryFormValues } from "@/types/category-types";

// Query key factory
const adminCategoryKeys = {
  all: ["admin", "categories"] as const,
  lists: () => [...adminCategoryKeys.all, "list"] as const,
  list: (query: Record<string, any>) => [...adminCategoryKeys.lists(), query] as const,
  details: () => [...adminCategoryKeys.all, "detail"] as const,
  detail: (id: string) => [...adminCategoryKeys.details(), id] as const,
};

// Hook for fetching categories
export function useAdminCategories(query: Record<string, any> = {}) {
  // Ensure we always pass a valid object with defaults
  const validatedQuery = {
    limit: 50,
    offset: 0,
    sortBy: "sortOrder" as const,
    sortDirection: "asc" as const,
    ...query,
  };

  return useQuery({
    queryKey: adminCategoryKeys.list(validatedQuery),
    queryFn: () => getAdminCategories({ data: validatedQuery }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for creating a category
export function useCreateAdminCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CategoryFormValues & { shopId: string }) => 
      createAdminCategory({ 
        data: {
          ...data,
          image: data.image || undefined,
          icon: data.icon || "",
          parentId: data.parentId || null,
        }
      }),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: adminCategoryKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Hook for updating a category
export function useUpdateAdminCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CategoryFormValues & { id: string; shopId: string }) => 
      updateAdminCategory({ 
        data: {
          ...data,
          image: data.image || undefined,
          icon: data.icon || "",
          parentId: data.parentId || null,
        }
      }),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: adminCategoryKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Hook for deleting a category
export function useDeleteAdminCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAdminCategory({ data: { id } }),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: adminCategoryKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Hook for toggling category status
export function useToggleAdminCategoryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      toggleAdminCategoryStatus({ data: { id, isActive } }),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: adminCategoryKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Hook for toggling category featured status
export function useToggleAdminCategoryFeatured() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) => 
      toggleAdminCategoryFeatured({ data: { id, featured } }),
    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: adminCategoryKeys.lists() });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
