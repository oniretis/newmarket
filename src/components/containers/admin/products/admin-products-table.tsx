import type { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/components/base/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NormalizedProduct } from "@/types/products";

interface AdminProductsTableProps {
  products: NormalizedProduct[];
  className?: string;
}

export default function AdminProductsTable({
  products,
  className,
}: AdminProductsTableProps) {
  const columns: ColumnDef<NormalizedProduct>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <div className="w-20 truncate text-muted-foreground text-xs">
          {row.getValue("id")}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "categoryName",
      header: "Category",
      cell: ({ row }) => (
        <div className="text-muted-foreground text-sm">
          {row.getValue("categoryName") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "brandName",
      header: "Brand",
      cell: ({ row }) => (
        <div className="text-muted-foreground text-sm">
          {row.getValue("brandName") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "sellingPrice",
      header: "Price",
      cell: ({ row }) => {
        const sellingPrice = row.original.sellingPrice;
        const regularPrice = row.original.regularPrice;
        return (
          <div className="font-medium">
            ${Number(sellingPrice).toFixed(2)}
            {regularPrice && Number(regularPrice) > Number(sellingPrice) && (
              <span className="ml-2 text-muted-foreground text-xs line-through">
                ${Number(regularPrice).toFixed(2)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => {
        const stock = row.original.stock;
        const lowStockThreshold = row.original.lowStockThreshold;
        const inStock = stock > 0;
        const isLowStock = stock <= lowStockThreshold;
        
        return (
          <Badge 
            variant={!inStock ? "destructive" : isLowStock ? "secondary" : "default"}
          >
            {!inStock ? "Out of Stock" : isLowStock ? `Low Stock (${stock})` : `${stock} in stock`}
          </Badge>
        );
      },
    },
    {
      accessorKey: "averageRating",
      header: "Rating",
      cell: ({ row }) => {
        const rating = Number(row.original.averageRating);
        const reviewCount = row.original.reviewCount;
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{rating.toFixed(1)}</span>
            <span className="text-muted-foreground text-xs">
              ({reviewCount} reviews)
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "shopName",
      header: "Store",
      cell: ({ row }) => (
        <div className="text-muted-foreground text-sm">
          {row.getValue("shopName") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge 
            variant={
              status === "active" ? "default" : 
              status === "draft" ? "secondary" : 
              "outline"
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "isFeatured",
      header: "Featured",
      cell: ({ row }) => {
        const isFeatured = row.getValue("isFeatured") as boolean;
        return isFeatured ? (
          <Badge variant="secondary">Featured</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: () => (
        <div className="text-right">
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return <DataTable columns={columns} data={products} className={className} />;
}
