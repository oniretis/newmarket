import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import AdminAttributesTemplate from "@/components/templates/admin/admin-attributes-template";
import { adminGetAttributes } from "@/lib/functions/admin/attributes";
import { getAdminShops } from "@/lib/functions/admin/shops";
import type { AttributeFormValues, AttributeItem } from "@/types/attributes";

export const Route = createFileRoute("/(admin)/admin/attributes/")({
  component: AdminAttributesPage,
});

function AdminAttributesPage() {
  const [attributes, setAttributes] = useState<AttributeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch attributes on component mount
  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        setLoading(true);
        const result = await adminGetAttributes({
          data: {
            limit: 100,
            offset: 0,
          },
        });
        setAttributes(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch attributes");
      } finally {
        setLoading(false);
      }
    };

    fetchAttributes();
  }, []);

  const handleAddAttribute = async (newAttributeData: AttributeFormValues) => {
    try {
      // For now, we'll need to implement this with a real shop ID
      // In a real implementation, you'd have a shop selector or get the first available shop
      const { adminCreateAttribute } = await import("@/lib/functions/admin/attributes");
      
      // Get first available shop for demo - in real app, you'd have a shop selector
      const shopsResult = await getAdminShops({
        data: {
          limit: 1,
          offset: 0,
        },
      });
      
      if (!shopsResult.data || shopsResult.data.length === 0) {
        throw new Error("No shops available. Please create a shop first.");
      }
      
      const firstShop = shopsResult.data[0];
      
      const result = await adminCreateAttribute({
        data: {
          shopId: firstShop.id,
          name: newAttributeData.name,
          slug: newAttributeData.slug,
          type: newAttributeData.type,
          values: newAttributeData.values,
        },
      });
      
      if (result.attribute) {
        setAttributes([...attributes, result.attribute]);
      }
    } catch (err) {
      throw err; // Let template handle error display
    }
  };

  const handleDeleteAttribute = async (attribute: AttributeItem) => {
    try {
      const { adminDeleteAttribute } = await import("@/lib/functions/admin/attributes");
      
      await adminDeleteAttribute({
        data: {
          id: attribute.id,
        },
      });
      
      setAttributes(
        attributes.filter((a) => a.id !== attribute.id)
      );
    } catch (err) {
      throw err; // Let template handle error display
    }
  };

  if (loading) {
    return <div className="p-6">Loading attributes...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  return (
    <AdminAttributesTemplate
      attributes={attributes}
      onAddAttribute={handleAddAttribute}
      onDeleteAttribute={handleDeleteAttribute}
    />
  );
}
