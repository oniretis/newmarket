import PageHeader from "@/components/base/common/page-header";
import { AdminSettingsTable } from "@/components/containers/admin/settings/admin-settings-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AdminEditSettingDialog } from "@/components/containers/admin/settings/admin-edit-setting-dialog";
import { adminInitializeDefaultSettings } from "@/lib/functions/admin/settings";
import { toast } from "sonner";

interface Setting {
  id: string;
  key: string;
  value: string;
  description: string;
  category: string;
  updatedAt: Date;
}

interface AdminSettingsTemplateProps {
  settings: Setting[];
  onRefresh?: () => void;
}

export default function AdminSettingsTemplate({
  settings,
  onRefresh,
}: AdminSettingsTemplateProps) {
  const [isInitializing, setIsInitializing] = useState(false);

  const handleInitializeDefaults = async () => {
    try {
      setIsInitializing(true);
      await adminInitializeDefaultSettings();
      toast.success("Default settings initialized successfully");
      onRefresh?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to initialize default settings");
    } finally {
      setIsInitializing(false);
    }
  };

  const emptySetting: Setting = {
    id: "",
    key: "",
    value: "",
    description: "",
    category: "General",
    updatedAt: new Date(),
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Manage platform settings and configurations"
      >
        <div className="flex gap-2">
          {settings.length === 0 && (
            <Button
              variant="outline"
              onClick={handleInitializeDefaults}
              disabled={isInitializing}
            >
              {isInitializing ? "Initializing..." : "Initialize Default Settings"}
            </Button>
          )}
          <AdminEditSettingDialog
            setting={emptySetting}
            onSuccess={onRefresh}
          >
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Setting
            </Button>
          </AdminEditSettingDialog>
        </div>
      </PageHeader>

      <AdminSettingsTable data={settings} onRefresh={onRefresh} />
    </div>
  );
}
