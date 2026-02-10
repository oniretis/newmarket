// ============================================================================
// Admin Products Functions
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { executeProductQuery } from "@/lib/helper/products-query-helpers";
import { adminMiddleware } from "@/lib/middleware/admin";

// ============================================================================
// Get All Products (Admin)
// ============================================================================

const adminProductsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
  search: z.string().optional().default(""),
  status: z.enum(["draft", "active", "archived"]).optional(),
  productType: z.enum(["simple", "variable"]).optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  tagId: z.string().optional(),
  attributeId: z.string().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  inStock: z.coerce.boolean().optional(),
  lowStock: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  sortBy: z.enum(["name", "sellingPrice", "stock", "averageRating", "reviewCount", "updatedAt", "createdAt"]).optional().default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const getAdminProducts = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(adminProductsQuerySchema.optional())
  .handler(async ({ data }) => {
    const {
      limit = 20,
      offset = 0,
      search = "",
      status,
      productType,
      categoryId,
      brandId,
      tagId,
      attributeId,
      isFeatured,
      isActive,
      inStock,
      lowStock,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      sortDirection = "desc",
    } = data || {};

    // Use shared query helper with admin-specific options
    const result = await executeProductQuery({
      baseConditions: [], // Admin can see all products (no shop filter)
      search,
      status,
      productType,
      categoryId,
      brandId,
      tagId,
      attributeId,
      isFeatured,
      isActive,
      inStock,
      lowStock,
      minPrice,
      maxPrice,
      limit,
      offset,
      sortBy,
      sortDirection,
      // Admin should see shop and vendor info
      includeShopInfo: true,
      includeVendorInfo: true,
      // Admin can see cost price
      excludeCostPrice: false,
    });

    return result;
  });
