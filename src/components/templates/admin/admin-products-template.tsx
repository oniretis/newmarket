import PageHeader from "@/components/base/common/page-header";
import AdminProductsTable from "@/components/containers/admin/products/admin-products-table";
import type { NormalizedProduct } from "@/types/products";

interface AdminProductsTemplateProps {
  products: NormalizedProduct[];
}

export default function AdminProductsTemplate({
  products,
}: AdminProductsTemplateProps) {
  return (
    <>
      <PageHeader
        title="Products"
        description="Manage all products across the platform"
      />

      <AdminProductsTable products={products} />
    </>
  );
}
