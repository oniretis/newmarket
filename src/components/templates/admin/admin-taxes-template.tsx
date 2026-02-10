import { Plus } from "lucide-react";
import { useState } from "react";
import { AddTaxDialog } from "@/components/containers/shared/taxes/add-tax-dialog";
import TaxHeader from "@/components/containers/shared/taxes/tax-header";
import { TaxTable } from "@/components/containers/shared/taxes/tax-table";
import { Button } from "@/components/ui/button";
import { ADMIN_TAX_PERMISSIONS } from "@/lib/config/tax-permissions";
import type { TaxRate } from "@/lib/db/schema/tax-schema";
import type { TaxRateItem } from "@/types/taxes";

interface AdminTaxesTemplateProps {
  taxes: TaxRate[];
  onAddTax: (data: Omit<TaxRate, "id" | "createdAt">) => void;
  onDeleteTax: (id: string) => void;
}

export default function AdminTaxesTemplate({
  taxes,
  onAddTax,
  onDeleteTax,
}: AdminTaxesTemplateProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <TaxHeader role="admin" showAddButton={false}>
        <AddTaxDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSubmit={(data) => onAddTax({
            ...data,
            shopId: '', // Admin will need to set this or it should come from context
            rate: data.rate.toString(),
            priority: data.priority.toString(),
            state: data.state || null,
            zip: data.zip || null,
            isActive: data.isActive ?? true,
            isCompound: data.isCompound ?? false,
            updatedAt: new Date(),
          })}
        />
        <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Tax
        </Button>
      </TaxHeader>

      <TaxTable
        taxes={taxes.map((tax): TaxRateItem => ({
          ...tax,
          shopId: tax.shopId || '',
          rate: tax.rate,
          priority: tax.priority || '1',
          isActive: tax.isActive ?? true,
          isCompound: tax.isCompound ?? false,
          state: tax.state || undefined,
          zip: tax.zip || undefined,
          createdAt: tax.createdAt.toISOString(),
          updatedAt: tax.updatedAt?.toISOString() || new Date().toISOString(),
        }))}
        onDelete={(taxRate) => onDeleteTax(taxRate.id)}
        mode="customer"
      />
    </div>
  );
}
