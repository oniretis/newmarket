import {
  EntityFormDialog,
  type EntityFormField,
} from "@/components/base/forms/entity-form-dialog";
import { createTagSchema } from "@/lib/validators/shared/tag-query";
import { useAdminShopsForSelect } from "@/hooks/admin/use-admin-shops";
import type { TagFormValues } from "@/types/tags";

interface AdminAddTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TagFormValues & { shopId: string }) => void;
  isSubmitting?: boolean;
  initialValues?: (TagFormValues & { shopId: string }) | null;
}

export function AdminAddTagDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  initialValues,
}: AdminAddTagDialogProps) {
  const { data: shops, isLoading: shopsLoading } = useAdminShopsForSelect();

  const fields: EntityFormField[] = [
    {
      name: "shopId",
      label: "Shop",
      required: true,
      type: "select",
      placeholder: "Select a shop",
      options: shops || [],
      loading: shopsLoading,
      description: "Choose which shop this tag belongs to",
    },
    {
      name: "name",
      label: "Tag Name",
      required: true,
      placeholder: "e.g. New Arrival, Best Seller, On Sale",
      autoGenerateSlug: true,
    },
    {
      name: "slug",
      label: "Slug",
      required: true,
      placeholder: "e.g. new-arrival, best-seller, on-sale",
      description: "URL-friendly identifier for your tag",
    },
    {
      name: "description",
      label: "Description",
      required: false,
      placeholder: "Optional description for this tag",
      type: "textarea",
      description: "Brief explanation of what this tag represents",
    },
  ];

  return (
    <EntityFormDialog<TagFormValues & { shopId: string }>
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      initialValues={initialValues}
      title="Tag"
      description={"Create a new tag to organize products in the selected shop."}
      validationSchema={createTagSchema}
      submitButtonText={{
        create: "Create Tag",
        update: "Update Tag",
      }}
      fields={fields}
    />
  );
}
