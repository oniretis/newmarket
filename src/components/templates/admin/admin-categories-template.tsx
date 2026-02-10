import { useState } from "react";
import CategoryHeader from "@/components/containers/shared/categories/category-header";
import { AdminCategoryTable } from "@/components/containers/shared/categories/category-table";
import { AddCategoryDialog } from "@/components/containers/shared/categories/add-category-dialog";
import type {
  CategoryFormValues,
  NormalizedCategory,
} from "@/types/category-types";

interface AdminCategoriesTemplateProps {
  categories: NormalizedCategory[];
  onCategoryStatusChange: (categoryId: string, newStatus: boolean) => void;
  onAddCategory: (category: CategoryFormValues) => void;
  onEditCategory?: (category: NormalizedCategory) => void;
  onDeleteCategory?: (category: NormalizedCategory) => void;
  onToggleFeatured?: (category: NormalizedCategory) => void;
  onOpenAddDialog?: () => void;
  isSubmitting?: boolean;
  editingCategory?: NormalizedCategory | null;
}

export default function AdminCategoriesTemplate({
  categories,
  onCategoryStatusChange,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onToggleFeatured,
  onOpenAddDialog,
  isSubmitting = false,
  editingCategory,
}: AdminCategoriesTemplateProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenAddDialog = () => {
    setIsDialogOpen(true);
    onOpenAddDialog?.();
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleSubmit = (data: CategoryFormValues) => {
    // For admin, use the first available shop or create a default
    // In a real implementation, you might want to show a shop selector
    let shopId = "default-shop";
    
    // Try to get a real shop ID from existing categories
    if (categories.length > 0) {
      const uniqueShops = [...new Set(categories.map(cat => cat.shopId))];
      shopId = uniqueShops[0] || shopId;
    }
    
    const categoryData = {
      ...data,
      shopId: editingCategory?.shopId || shopId,
    };
    onAddCategory(categoryData);
    handleCloseDialog();
  };

  // Convert editingCategory to CategoryFormValues for the dialog
  const dialogInitialValues = editingCategory ? {
    name: editingCategory.name,
    slug: editingCategory.slug,
    description: editingCategory.description || undefined,
    image: editingCategory.image,
    icon: editingCategory.icon || undefined,
    parentId: editingCategory.parentId || undefined,
  } : null;

  return (
    <div className="space-y-6">
      <CategoryHeader onAdd={handleOpenAddDialog} role="admin" />
      <AdminCategoryTable
        categories={categories}
        onToggleActive={(category) =>
          onCategoryStatusChange(category.id, !category.isActive)
        }
        onEdit={onEditCategory}
        onDelete={onDeleteCategory}
        onToggleFeatured={onToggleFeatured}
      />
      
      <AddCategoryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
        categories={categories}
        isSubmitting={isSubmitting}
        initialValues={dialogInitialValues}
        isAdmin={true}
      />
    </div>
  );
}
