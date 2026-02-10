import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminBrandsTemplate from "@/components/templates/admin/admin-brands-template";
import {
  adminGetBrands,
  adminCreateBrand,
  adminDeleteBrand,
} from "@/lib/functions/admin/brands";
import { getAdminShops } from "@/lib/functions/admin/shops";
import type { BrandFormValues, BrandItem } from "@/types/brands";

export const Route = createFileRoute("/(admin)/admin/brands/")({
  component: AdminBrandsPage,
});

function AdminBrandsPage() {
  const queryClient = useQueryClient();
  const [selectedShopId, setSelectedShopId] = useState<string>("");

  // Fetch brands from server
  const { data: brandsData, isLoading: brandsLoading, error: brandsError } = useQuery({
    queryKey: ["admin", "brands", selectedShopId],
    queryFn: () => adminGetBrands({ 
      data: selectedShopId ? { shopId: selectedShopId } : {}
    }),
  });

  // Fetch shops for selection
  const { data: shopsData, isLoading: shopsLoading } = useQuery({
    queryKey: ["admin", "shops"],
    queryFn: () => getAdminShops({ data: { limit: 100, offset: 0 } }),
  });

  // Create brand mutation
  const createBrandMutation = useMutation({
    mutationFn: (data: BrandFormValues & { shopId: string }) => adminCreateBrand({ 
      data: {
        ...data,
        logo: data.logo || undefined,
        website: data.website || undefined,
        description: data.description || undefined,
      }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "brands"] });
    },
  });

  // Delete brand mutation
  const deleteBrandMutation = useMutation({
    mutationFn: (brandId: string) => adminDeleteBrand({ data: { id: brandId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "brands"] });
    },
  });

  const handleAddBrand = (newBrandData: BrandFormValues) => {
    if (!selectedShopId) {
      alert("Please select a shop first");
      return;
    }
    
    createBrandMutation.mutate({
      ...newBrandData,
      shopId: selectedShopId,
    });
  };

  const handleDeleteBrand = (brand: BrandItem) => {
    deleteBrandMutation.mutate(brand.id);
  };

  if (brandsLoading || shopsLoading) {
    return <div>Loading brands...</div>;
  }

  if (brandsError) {
    return <div>Error loading brands: {(brandsError as Error).message}</div>;
  }

  const brands = brandsData?.data ?? [];
  const shops = shopsData?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Shop Selector */}
      <div className="flex items-center space-x-4">
        <label htmlFor="shop-select" className="text-sm font-medium">
          Select Shop:
        </label>
        <select
          id="shop-select"
          value={selectedShopId}
          onChange={(e) => setSelectedShopId(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Shops</option>
          {shops.map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.name}
            </option>
          ))}
        </select>
      </div>

      <AdminBrandsTemplate
        brands={brands}
        onAddBrand={handleAddBrand}
        onDeleteBrand={handleDeleteBrand}
      />
    </div>
  );
}
