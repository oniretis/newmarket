import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminGetTags,
  adminGetTagById,
  adminCreateTag,
  adminUpdateTag,
  adminDeleteTag,
  adminGetTagStats,
} from "@/lib/functions/admin/tags";
import type { TagFormValues } from "@/types/tags";

// ============================================================================
// Query Keys
// ============================================================================

export const adminTagsKeys = {
  all: ["admin", "tags"] as const,
  lists: () => [...adminTagsKeys.all, "list"] as const,
  list: (params: any) => [...adminTagsKeys.lists(), params] as const,
  details: () => [...adminTagsKeys.all, "detail"] as const,
  detail: (id: string) => [...adminTagsKeys.details(), id] as const,
  stats: () => [...adminTagsKeys.all, "stats"] as const,
};

// ============================================================================
// Get Tags Hook
// ============================================================================

export function useAdminTags(params?: {
  limit?: number;
  offset?: number;
  search?: string;
  isActive?: boolean;
  shopId?: string;
  sortBy?: "createdAt" | "name" | "sortOrder" | "productCount";
  sortDirection?: "asc" | "desc";
}) {
  return useQuery({
    queryKey: adminTagsKeys.list(params || {}),
    queryFn: () => adminGetTags({ data: params || {} }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============================================================================
// Get Tag by ID Hook
// ============================================================================

export function useAdminTag(id: string) {
  return useQuery({
    queryKey: adminTagsKeys.detail(id),
    queryFn: () => adminGetTagById({ data: { id } }),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============================================================================
// Get Tag Stats Hook
// ============================================================================

export function useAdminTagStats() {
  return useQuery({
    queryKey: adminTagsKeys.stats(),
    queryFn: adminGetTagStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============================================================================
// Create Tag Hook
// ============================================================================

export function useAdminCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TagFormValues & { shopId: string }) => adminCreateTag({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminTagsKeys.all });
      toast.success("Tag created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ============================================================================
// Update Tag Hook
// ============================================================================

export function useAdminUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TagFormValues & { id: string; shopId: string }) => adminUpdateTag({ data }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: adminTagsKeys.all });
      queryClient.invalidateQueries({ queryKey: adminTagsKeys.detail(variables.id) });
      toast.success("Tag updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ============================================================================
// Delete Tag Hook
// ============================================================================

export function useAdminDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminDeleteTag({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminTagsKeys.all });
      toast.success("Tag deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
