import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import AdminProductsTemplate from "@/components/templates/admin/admin-products-template";
import { getAdminProducts } from "@/lib/functions/admin/products";
import type { NormalizedProduct } from "@/types/products";

export const Route = createFileRoute("/(admin)/admin/products/")({
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const [products, setProducts] = useState<NormalizedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const result = await getAdminProducts();
        setProducts(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <div>Loading products...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return <AdminProductsTemplate products={products} />;
}
