/**
 * Admin Brand Server Functions
 *
 * Server functions for brand management in the admin dashboard.
 * Provides access to all brands across all shops for admin users.
 */

import { createServerFn } from "@tanstack/react-start";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { brands } from "@/lib/db/schema/brand-schema";
import { shops } from "@/lib/db/schema/shop-schema";
import {
  executeBrandQuery,
  fetchBrandWithRelations,
} from "@/lib/helper/brands-query-helpers";
import { adminMiddleware } from "@/lib/middleware/admin";
import { generateSlug } from "@/lib/utils/slug";
import {
  createBrandSchema,
  updateBrandSchema,
  adminBrandsQuerySchema,
} from "@/lib/validators/shared/brand-query";
import { createSuccessResponse } from "@/types/api-response";
import type {
  BrandListResponse,
  CreateBrandResponse,
  UpdateBrandResponse,
  DeleteBrandResponse,
} from "@/types/brands";

// ============================================================================
// Get All Brands (Admin)
// ============================================================================

export const adminGetBrands = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(adminBrandsQuerySchema.optional())
  .handler(async ({ data }): Promise<BrandListResponse> => {
    const {
      limit = 10,
      offset = 0,
      search,
      isActive,
      shopId,
      sortBy = "sortOrder",
      sortDirection = "asc",
    } = data || {};

    // Build base conditions
    const baseConditions = [];
    if (shopId) {
      baseConditions.push(eq(brands.shopId, shopId));
    }

    // Use shared query helper with admin-specific options
    return executeBrandQuery({
      baseConditions,
      search,
      isActive,
      limit,
      offset,
      sortBy: sortBy as any,
      sortDirection,
      includeShopInfo: true,
    });
  });

// ============================================================================
// Get Brand by ID (Admin)
// ============================================================================

export const adminGetBrandById = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const { id } = data;

    // Get brand with shop info
    const brand = await db.query.brands.findFirst({
      where: eq(brands.id, id),
      with: {
        shop: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!brand) {
      throw new Error("Brand not found.");
    }

    // Use shared helper for fetching with relations
    const normalizedBrand = await fetchBrandWithRelations(brand, {
      includeShopInfo: true,
    });

    return { brand: normalizedBrand };
  });

// ============================================================================
// Create Brand (Admin)
// ============================================================================

export const adminCreateBrand = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(createBrandSchema)
  .handler(async ({ data }): Promise<CreateBrandResponse> => {
    const { shopId, ...brandData } = data;

    // Verify shop exists
    const shop = await db.query.shops.findFirst({
      where: eq(shops.id, shopId),
    });

    if (!shop) {
      throw new Error("Shop not found.");
    }

    // Generate slug if not provided
    let slug = brandData.slug;
    if (!slug) {
      slug = generateSlug(brandData.name);
    }

    // Check for duplicate slug within the shop
    const existingBrand = await db.query.brands.findFirst({
      where: and(eq(brands.shopId, shopId), eq(brands.slug, slug)),
    });

    if (existingBrand) {
      throw new Error(
        "A brand with this slug already exists in this shop. Please choose a different name or slug."
      );
    }

    // Create the brand
    const brandId = crypto.randomUUID();

    await db.insert(brands).values({
      id: brandId,
      shopId: shopId,
      name: brandData.name,
      slug: slug,
      description: brandData.description || null,
      logo: brandData.logo || null,
      website: brandData.website || null,
      sortOrder: brandData.sortOrder ?? 0,
      isActive: brandData.isActive ?? true,
      productCount: 0,
    });

    // Fetch the created brand
    const newBrand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
      with: {
        shop: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!newBrand) {
      throw new Error("Failed to create brand.");
    }

    // Use shared helper for fetching with relations
    const normalizedBrand = await fetchBrandWithRelations(newBrand, {
      includeShopInfo: true,
    });

    return {
      ...createSuccessResponse("Brand created successfully"),
      brand: normalizedBrand,
    };
  });

// ============================================================================
// Update Brand (Admin)
// ============================================================================

export const adminUpdateBrand = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(updateBrandSchema)
  .handler(async ({ data }): Promise<UpdateBrandResponse> => {
    const { id, shopId, ...updateData } = data;

    // Check if brand exists
    const existingBrand = await db.query.brands.findFirst({
      where: eq(brands.id, id),
    });

    if (!existingBrand) {
      throw new Error("Brand not found.");
    }

    // Check for duplicate slug if slug is being updated
    if (updateData.slug && updateData.slug !== existingBrand.slug) {
      const slugExists = await db.query.brands.findFirst({
        where: and(
          eq(brands.shopId, existingBrand.shopId),
          eq(brands.slug, updateData.slug)
        ),
      });

      if (slugExists) {
        throw new Error("A brand with this slug already exists in this shop.");
      }
    }

    // Build update object
    const updateValues: Record<string, any> = {};
    if (updateData.name !== undefined) updateValues.name = updateData.name;
    if (updateData.slug !== undefined) updateValues.slug = updateData.slug;
    if (updateData.description !== undefined)
      updateValues.description = updateData.description;
    if (updateData.logo !== undefined)
      updateValues.logo = updateData.logo || null;
    if (updateData.website !== undefined)
      updateValues.website = updateData.website || null;
    if (updateData.sortOrder !== undefined)
      updateValues.sortOrder = updateData.sortOrder;
    if (updateData.isActive !== undefined)
      updateValues.isActive = updateData.isActive;

    // Update the brand
    if (Object.keys(updateValues).length > 0) {
      await db.update(brands).set(updateValues).where(eq(brands.id, id));
    }

    // Fetch updated brand with relations
    const updatedBrand = await db.query.brands.findFirst({
      where: eq(brands.id, id),
      with: {
        shop: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!updatedBrand) {
      throw new Error("Failed to update brand.");
    }

    // Use shared helper for fetching with relations
    const normalizedBrand = await fetchBrandWithRelations(updatedBrand, {
      includeShopInfo: true,
    });

    return {
      ...createSuccessResponse("Brand updated successfully"),
      brand: normalizedBrand,
    };
  });

// ============================================================================
// Delete Brand (Admin)
// ============================================================================

export const adminDeleteBrand = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }): Promise<DeleteBrandResponse> => {
    const { id } = data;

    const existingBrand = await db.query.brands.findFirst({
      where: eq(brands.id, id),
    });

    if (!existingBrand) {
      throw new Error("Brand not found.");
    }

    const productCount = existingBrand.productCount ?? 0;
    if (productCount > 0) {
      throw new Error(
        `Cannot delete brand "${existingBrand.name}" with ${productCount} associated products. Please reassign products first.`
      );
    }

    // Delete the brand
    await db.delete(brands).where(eq(brands.id, id));

    return createSuccessResponse("Brand deleted successfully");
  });

// ============================================================================
// Toggle Brand Status (Admin)
// ============================================================================

export const adminToggleBrandStatus = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(z.object({
    brandId: z.string(),
    isActive: z.boolean(),
  }))
  .handler(async ({ data }) => {
    const { brandId, isActive } = data;

    // Check if brand exists
    const existingBrand = await db.query.brands.findFirst({
      where: eq(brands.id, brandId),
    });

    if (!existingBrand) {
      throw new Error("Brand not found.");
    }

    // Update brand status
    await db
      .update(brands)
      .set({ isActive })
      .where(eq(brands.id, brandId));

    return createSuccessResponse(`Brand status updated to ${isActive ? "active" : "inactive"}`);
  });

// ============================================================================
// Get Brand Stats (Admin)
// ============================================================================

export const adminGetBrandStats = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async () => {
    const totalBrands = await db.select({ count: count() }).from(brands);
    
    const activeBrands = await db
      .select({ count: count() })
      .from(brands)
      .where(eq(brands.isActive, true));

    const inactiveBrands = await db
      .select({ count: count() })
      .from(brands)
      .where(eq(brands.isActive, false));

    // Get brands with products
    const brandsWithProducts = await db
      .select({ count: count() })
      .from(brands)
      .where(and(eq(brands.isActive, true), eq(brands.productCount, 0)));

    return {
      totalBrands: Number(totalBrands[0]?.count ?? 0),
      activeBrands: Number(activeBrands[0]?.count ?? 0),
      inactiveBrands: Number(inactiveBrands[0]?.count ?? 0),
      brandsWithProducts: Number(brandsWithProducts[0]?.count ?? 0),
    };
  });
