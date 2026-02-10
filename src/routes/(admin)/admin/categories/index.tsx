import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import AdminCategoriesTemplate from "@/components/templates/admin/admin-categories-template";
import { useAdminCategories, useCreateAdminCategory, useToggleAdminCategoryStatus, useToggleAdminCategoryFeatured } from "@/hooks/admin/use-admin-categories";
import type { NormalizedCategory, CategoryFormValues } from "@/types/category-types";
import { useEntityCRUD } from "@/hooks/common/use-entity-crud";
import { deleteAdminCategory } from "@/lib/functions/admin/categories";

export const Route = createFileRoute("/(admin)/admin/categories/")({
  component: AdminCategoriesPage,
});

function AdminCategoriesPage() {
  const [query, setQuery] = useState({
    limit: 50,
    offset: 0,
    sortBy: "sortOrder",
    sortDirection: "asc" as const,
  });

  // Fetch categories from database
  const { data: categoriesData, isLoading, error } = useAdminCategories(query);
  const categories = categoriesData?.data || [];

  // Mutations
  const createCategoryMutation = useCreateAdminCategory();
  const toggleStatusMutation = useToggleAdminCategoryStatus();
  const toggleFeaturedMutation = useToggleAdminCategoryFeatured();

  // CRUD operations
  const { isDialogOpen, setIsDialogOpen, editingItem, setEditingItem, deletingItem, setDeletingItem, handleAdd, handleEdit, handleDelete, confirmDelete, handleDialogClose } = useEntityCRUD<NormalizedCategory>({
    onDelete: deleteAdminCategory,
  });

  const handleCategoryStatusChange = (categoryId: string, newStatus: boolean) => {
    toggleStatusMutation.mutate({ id: categoryId, isActive: newStatus });
  };

  const handleAddCategory = (data: CategoryFormValues & { shopId: string }) => {
    createCategoryMutation.mutate(data);
    handleDialogClose();
  };

  const handleEditCategory = (category: NormalizedCategory) => {
    handleEdit(category);
  };

  const handleDeleteCategory = (category: NormalizedCategory) => {
    handleDelete(category);
  };

  const handleToggleFeatured = (category: NormalizedCategory) => {
    toggleFeaturedMutation.mutate({ id: category.id, featured: !category.featured });
  };

  const handleOpenAddDialog = () => {
    handleAdd();
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">Error loading categories: {error.message}</div>
      </div>
    );
  }

  return (
    <AdminCategoriesTemplate
      categories={categories}
      onCategoryStatusChange={handleCategoryStatusChange}
      onAddCategory={handleAddCategory}
      onEditCategory={handleEditCategory}
      onDeleteCategory={handleDeleteCategory}
      onToggleFeatured={handleToggleFeatured}
      onOpenAddDialog={handleOpenAddDialog}
      isSubmitting={createCategoryMutation.isPending}
      editingCategory={editingItem}
    />
  );
}
