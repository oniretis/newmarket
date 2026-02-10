import { createServerFn } from "@tanstack/react-start";
import { and, count, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema/category-schema";
import {
  executeCategoryQuery,
  fetchCategoryWithRelations,
} from "@/lib/helper/category-query-helpers";
import { authMiddleware } from "@/lib/middleware/auth";
import { generateSlug } from "@/lib/utils/slug";
import {
  createCategorySchema,
  updateCategorySchema,
} from "@/lib/validators/category";
import {
  type AdminCategoriesQuery,
  adminCategoriesQuerySchema,
} from "@/lib/validators/shared/category-query";
import { createSuccessResponse } from "@/types/api-response";
import type { CategoryListResponse } from "@/types/category-types";

// ============================================================================
// Get All Categories (Admin - across all shops)
// ============================================================================
export const getAdminCategories = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(adminCategoriesQuerySchema)
  .handler(async ({ context, data }): Promise<CategoryListResponse> => {
    const {
      limit,
      offset,
      search,
      parentId,
      isActive,
      featured,
      sortBy,
      sortDirection,
    } = data as AdminCategoriesQuery;

    // Use shared query helper without shop filter for admin
    return executeCategoryQuery({
      baseConditions: [], // No shop filter for admin
      search,
      parentId: parentId ?? undefined,
      isActive,
      featured,
      limit,
      offset,
      sortBy,
      sortDirection,
      includeShopInfo: true, // Include shop info for admin
    });
  });

// ============================================================================
// Get Category by ID (Admin)
// ============================================================================
export const getAdminCategoryById = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    const { id } = data as { id: string };

    // Get category
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));

    if (!category) {
      throw new Error("Category not found.");
    }

    // Use shared helper for fetching with relations
    const normalizedCategory = await fetchCategoryWithRelations(category, {
      includeShopInfo: true,
    });

    return { category: normalizedCategory };
  });

// ============================================================================
// Create Category (Admin)
// ============================================================================
export const createAdminCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(createCategorySchema)
  .handler(async ({ context, data }) => {
    const { shopId, ...categoryData } = data;

    // Generate slug if not provided
    let slug = categoryData.slug;
    if (!slug) {
      slug = generateSlug(categoryData.name);
    }

    // Check for duplicate slug within the shop
    const existingCategory = await db.query.categories.findFirst({
      where: and(eq(categories.shopId, shopId), eq(categories.slug, slug)),
    });

    if (existingCategory) {
      throw new Error(
        "A category with this slug already exists in this shop. Please choose a different name or slug."
      );
    }

    // Calculate level based on parent
    let level = 0;
    if (categoryData.parentId) {
      const parent = await db.query.categories.findFirst({
        where: eq(categories.id, categoryData.parentId),
        columns: { level: true },
      });
      level = (parent?.level ?? 0) + 1;
    }

    // Create the category
    const categoryId = uuidv4();

    await db.insert(categories).values({
      id: categoryId,
      shopId: shopId,
      name: categoryData.name,
      slug: slug,
      description: categoryData.description || null,
      image: categoryData.image || null,
      icon: categoryData.icon || null,
      parentId: categoryData.parentId || null,
      level: level,
      sortOrder: categoryData.sortOrder ?? 0,
      isActive: categoryData.isActive ?? true,
      featured: categoryData.featured ?? false,
      productCount: 0,
    });

    // Fetch the created category
    const newCategory = await db.query.categories.findFirst({
      where: eq(categories.id, categoryId),
    });

    if (!newCategory) {
      throw new Error("Failed to create category.");
    }

    const normalizedCategory = await fetchCategoryWithRelations(newCategory, {
      includeShopInfo: true,
    });

    return {
      ...createSuccessResponse("Category created successfully"),
      category: normalizedCategory,
    };
  });

// ============================================================================
// Update Category (Admin)
// ============================================================================
export const updateAdminCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(updateCategorySchema)
  .handler(async ({ context, data }) => {
    const { id, ...updateData } = data;

    // Check if category exists
    const existingCategory = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!existingCategory) {
      throw new Error("Category not found.");
    }

    // Check for duplicate slug if slug is being updated
    if (updateData.slug && updateData.slug !== existingCategory.slug) {
      const slugExists = await db.query.categories.findFirst({
        where: and(
          eq(categories.shopId, existingCategory.shopId),
          eq(categories.slug, updateData.slug)
        ),
      });

      if (slugExists) {
        throw new Error(
          "A category with this slug already exists in this shop."
        );
      }
    }

    // Calculate new level if parent is changing
    let newLevel = existingCategory.level;
    if (
      updateData.parentId !== undefined &&
      updateData.parentId !== existingCategory.parentId
    ) {
      if (updateData.parentId) {
        // Prevent setting self as parent
        if (updateData.parentId === id) {
          throw new Error("A category cannot be its own parent.");
        }

        const parent = await db.query.categories.findFirst({
          where: eq(categories.id, updateData.parentId),
          columns: { level: true, id: true },
        });

        if (!parent) {
          throw new Error("Parent category not found.");
        }

        newLevel = (parent.level ?? 0) + 1;
      } else {
        newLevel = 0;
      }
    }

    // Build update object
    const updateValues: Record<string, any> = {};
    if (updateData.name !== undefined) updateValues.name = updateData.name;
    if (updateData.slug !== undefined) updateValues.slug = updateData.slug;
    if (updateData.description !== undefined)
      updateValues.description = updateData.description;
    if (updateData.image !== undefined)
      updateValues.image = updateData.image || null;
    if (updateData.icon !== undefined)
      updateValues.icon = updateData.icon || null;
    if (updateData.parentId !== undefined) {
      updateValues.parentId = updateData.parentId || null;
      updateValues.level = newLevel;
    }
    if (updateData.sortOrder !== undefined)
      updateValues.sortOrder = updateData.sortOrder;
    if (updateData.isActive !== undefined)
      updateValues.isActive = updateData.isActive;
    if (updateData.featured !== undefined)
      updateValues.featured = updateData.featured;

    // Update the category
    await db.update(categories).set(updateValues).where(eq(categories.id, id));

    // Fetch updated category with relations
    const [updatedCategory] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));

    if (!updatedCategory) {
      throw new Error("Failed to update category.");
    }

    const normalizedCategory = await fetchCategoryWithRelations(
      updatedCategory,
      {
        includeShopInfo: true,
      }
    );

    return {
      ...createSuccessResponse("Category updated successfully"),
      category: normalizedCategory,
    };
  });

// ============================================================================
// Delete Category (Admin)
// ============================================================================
export const deleteAdminCategory = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    const { id } = data as { id: string };

    const existingCategory = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!existingCategory) {
      throw new Error("Category not found.");
    }

    const productCount = existingCategory.productCount ?? 0;
    if (productCount > 0) {
      throw new Error(
        `Cannot delete category "${existingCategory.name}" with ${productCount} associated products. Please reassign products first.`
      );
    }

    const childrenCount = await db
      .select({ count: count() })
      .from(categories)
      .where(eq(categories.parentId, id));

    if (childrenCount[0]?.count > 0) {
      throw new Error(
        "Cannot delete a category that has subcategories. Please delete or reassign subcategories first."
      );
    }

    // Delete the category
    await db.delete(categories).where(eq(categories.id, id));

    return createSuccessResponse("Category deleted successfully");
  });

// ============================================================================
// Toggle Category Status (Admin)
// ============================================================================
export const toggleAdminCategoryStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ 
    id: z.string(),
    isActive: z.boolean()
  }))
  .handler(async ({ context, data }) => {
    const { id, isActive } = data as { id: string; isActive: boolean };

    const existingCategory = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!existingCategory) {
      throw new Error("Category not found.");
    }

    // Update the category status
    await db
      .update(categories)
      .set({ isActive })
      .where(eq(categories.id, id));

    return createSuccessResponse(
      `Category ${isActive ? 'activated' : 'deactivated'} successfully`
    );
  });

// ============================================================================
// Toggle Category Featured (Admin)
// ============================================================================
export const toggleAdminCategoryFeatured = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ 
    id: z.string(),
    featured: z.boolean()
  }))
  .handler(async ({ context, data }) => {
    const { id, featured } = data as { id: string; featured: boolean };

    const existingCategory = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    if (!existingCategory) {
      throw new Error("Category not found.");
    }

    // Update the category featured status
    await db
      .update(categories)
      .set({ featured })
      .where(eq(categories.id, id));

    return createSuccessResponse(
      `Category ${featured ? 'featured' : 'unfeatured'} successfully`
    );
  });
