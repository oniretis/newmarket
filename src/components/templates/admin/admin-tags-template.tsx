import { Plus } from "lucide-react";
import { useState } from "react";
import { AdminAddTagDialog } from "@/components/containers/admin/tags/admin-add-tag-dialog";
import TagHeader from "@/components/containers/shared/tags/tag-header";
import TagTable from "@/components/containers/shared/tags/tag-table";
import { Button } from "@/components/ui/button";
import type { TagFormValues, TagItem } from "@/types/tags";

interface AdminTagsTemplateProps {
  tags: TagItem[];
  onAddTag: (data: TagFormValues & { shopId: string }) => void;
  onDeleteTag: (tag: TagItem) => void;
}

export default function AdminTagsTemplate({
  tags,
  onAddTag,
  onDeleteTag,
}: AdminTagsTemplateProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <TagHeader role="admin" showAddButton={false}>
        <AdminAddTagDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSubmit={onAddTag}
        />
        <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Tag
        </Button>
      </TagHeader>
      <TagTable tags={tags} onDelete={onDeleteTag} mode="admin" />
    </div>
  );
}
