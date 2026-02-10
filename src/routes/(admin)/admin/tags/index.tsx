import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import AdminTagsTemplate from "@/components/templates/admin/admin-tags-template";
import { useAdminTags, useAdminCreateTag, useAdminDeleteTag } from "@/hooks/admin/use-admin-tags";
import type { TagFormValues, TagItem } from "@/types/tags";

export const Route = createFileRoute("/(admin)/admin/tags/")({
  component: AdminTagsPage,
});

function AdminTagsPage() {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  
  const { data: tagsData, isLoading, error } = useAdminTags({
    limit: 20,
    offset: page * 20,
    search: search || undefined,
  });
  
  const createTagMutation = useAdminCreateTag();
  const deleteTagMutation = useAdminDeleteTag();

  const handleAddTag = (newTagData: TagFormValues & { shopId: string }) => {
    createTagMutation.mutate(newTagData);
  };

  const handleDeleteTag = (tag: TagItem) => {
    deleteTagMutation.mutate(tag.id);
  };

  if (isLoading) {
    return <div>Loading tags...</div>;
  }

  if (error) {
    return <div>Error loading tags: {error.message}</div>;
  }

  return (
    <AdminTagsTemplate
      tags={tagsData?.tags || []}
      onAddTag={handleAddTag}
      onDeleteTag={handleDeleteTag}
    />
  );
}
