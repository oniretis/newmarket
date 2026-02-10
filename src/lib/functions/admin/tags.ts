/**
 * Admin Tag Server Functions
 *
 * Server functions for tag management in the admin dashboard.
 * Provides access to all tags across all shops for admin users.
 */

import { createServerFn } from "@tanstack/react-start";
import { and, count, eq, ilike } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema/tags-schema";
import { shops } from "@/lib/db/schema/shop-schema";
import { user } from "@/lib/db/schema/auth-schema";
import {
  executeTagQuery,
  fetchTagWithRelations,
} from "@/lib/helper/tag-query-helpers";
import { adminMiddleware } from "@/lib/middleware/admin";
import {
  createTagSchema,
  deleteTagSchema,
  getTagByIdSchema,
  updateTagSchema,
} from "@/lib/validators/shared/tag-query";
import { createSuccessResponse } from "@/types/api-response";
import type {
  TagListResponse,
  CreateTagResponse,
  DeleteTagResponse,
  UpdateTagResponse,
} from "@/types/tags";

// ============================================================================
// Admin Query Schema
// ============================================================================

const adminTagsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  shopId: z.string().optional(),
  sortBy: z.enum(["name", "productCount", "sortOrder", "createdAt"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

// ============================================================================
// Get All Tags (Admin)
// ============================================================================

export const adminGetTags = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(adminTagsQuerySchema)
  .handler(async ({ data }): Promise<TagListResponse> => {
    const {
      limit,
      offset,
      search,
      isActive,
      shopId,
      sortBy,
      sortDirection,
    } = data;

    // Build base conditions
    const baseConditions = [];
    if (shopId) {
      baseConditions.push(eq(tags.shopId, shopId));
    }

    // Use shared query helper with admin-specific options
    return executeTagQuery({
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
// Get Tag by ID (Admin)
// ============================================================================

export const adminGetTagById = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(getTagByIdSchema)
  .handler(async ({ context, data }) => {
    const { id } = data;

    // Get tag with shop info
    const tag = await db.query.tags.findFirst({
      where: eq(tags.id, id),
      with: {
        shop: {
          with: {
            owner: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!tag) {
      throw new Error("Tag not found.");
    }

    // Use shared helper for fetching with relations
    const normalizedTag = await fetchTagWithRelations(tag, {
      includeShopInfo: true,
    });

    return { tag: normalizedTag };
  });

// ============================================================================
// Create Tag (Admin)
// ============================================================================

export const adminCreateTag = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(createTagSchema)
  .handler(async ({ context, data }) => {
    const { shopId, ...tagData } = data;

    // Verify shop exists
    const shop = await db.query.shops.findFirst({
      where: eq(shops.id, shopId),
    });

    if (!shop) {
      throw new Error("Shop not found.");
    }

    // Generate slug if not provided
    let slug = tagData.slug;
    if (!slug) {
      slug = tagData.name.toLowerCase().replace(/\s+/g, "-");
    }

    // Check for duplicate slug within the shop
    const existingTag = await db.query.tags.findFirst({
      where: and(
        eq(tags.shopId, shopId),
        eq(tags.slug, slug),
      ),
    });

    if (existingTag) {
      throw new Error(
        "A tag with this slug already exists in this shop. Please choose a different name or slug.",
      );
    }

    // Create the tag
    const tagId = crypto.randomUUID();

    await db.insert(tags).values({
      id: tagId,
      shopId: shopId,
      name: tagData.name,
      slug: slug,
      description: tagData.description || null,
      sortOrder: tagData.sortOrder ?? 0,
      isActive: tagData.isActive ?? true,
      productCount: 0,
    });

    // Fetch the created tag with relations
    const newTag = await db.query.tags.findFirst({
      where: eq(tags.id, tagId),
      with: {
        shop: {
          with: {
            owner: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!newTag) {
      throw new Error("Failed to create tag.");
    }

    // Use shared helper for fetching with relations
    const normalizedTag = await fetchTagWithRelations(newTag, {
      includeShopInfo: true,
    });

    return {
      ...createSuccessResponse("Tag created successfully"),
      tag: normalizedTag,
    };
  });

// ============================================================================
// Update Tag (Admin)
// ============================================================================

export const adminUpdateTag = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(updateTagSchema)
  .handler(async ({ context, data }): Promise<UpdateTagResponse> => {
    const { id, ...updateData } = data;

    // Check if tag exists
    const existingTag = await db.query.tags.findFirst({
      where: eq(tags.id, id),
    });

    if (!existingTag) {
      throw new Error("Tag not found.");
    }

    // Check for duplicate slug if slug is being updated
    if (updateData.slug && updateData.slug !== existingTag.slug) {
      const slugExists = await db.query.tags.findFirst({
        where: and(
          eq(tags.shopId, existingTag.shopId),
          eq(tags.slug, updateData.slug),
        ),
      });

      if (slugExists) {
        throw new Error("A tag with this slug already exists in this shop.");
      }
    }

    // Build update object
    const updateValues: Record<string, any> = {};

    if (updateData.name !== undefined) updateValues.name = updateData.name;
    if (updateData.slug !== undefined) updateValues.slug = updateData.slug;
    if (updateData.description !== undefined)
      updateValues.description = updateData.description;
    if (updateData.sortOrder !== undefined)
      updateValues.sortOrder = updateData.sortOrder;
    if (updateData.isActive !== undefined)
      updateValues.isActive = updateData.isActive;

    // Update the tag
    if (Object.keys(updateValues).length > 0) {
      await db.update(tags).set(updateValues).where(eq(tags.id, id));
    }

    // Fetch updated tag with relations
    const updatedTag = await db.query.tags.findFirst({
      where: eq(tags.id, id),
      with: {
        shop: {
          with: {
            owner: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!updatedTag) {
      throw new Error("Failed to update tag.");
    }

    // Use shared helper for fetching with relations
    const normalizedTag = await fetchTagWithRelations(updatedTag, {
      includeShopInfo: true,
    });

    return {
      ...createSuccessResponse("Tag updated successfully"),
      tag: normalizedTag,
    };
  });

// ============================================================================
// Delete Tag (Admin)
// ============================================================================

export const adminDeleteTag = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(deleteTagSchema)
  .handler(async ({ context, data }): Promise<DeleteTagResponse> => {
    const { id } = data;

    // Check if tag exists
    const existingTag = await db.query.tags.findFirst({
      where: eq(tags.id, id),
    });

    if (!existingTag) {
      throw new Error("Tag not found.");
    }

    // Check actual product count from tags table
    const actualProductCount = existingTag.productCount ?? 0;
    if (actualProductCount > 0) {
      throw new Error(
        "Cannot delete a tag that is assigned to products. Please remove it from products first."
      );
    }

    // Delete the tag
    await db.delete(tags).where(eq(tags.id, id));

    return createSuccessResponse("Tag deleted successfully");
  });

// ============================================================================
// Get Tag Stats (Admin)
// ============================================================================

export const adminGetTagStats = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async () => {
    const totalTags = await db.select({ count: count() }).from(tags);
    
    const activeTags = await db
      .select({ count: count() })
      .from(tags)
      .where(eq(tags.isActive, true));

    const totalProductAssignments = await db
      .select({ total: count() })
      .from(tags);

    return {
      totalTags: Number(totalTags[0]?.count ?? 0),
      activeTags: Number(activeTags[0]?.count ?? 0),
      totalProductAssignments: Number(totalProductAssignments[0]?.total ?? 0),
    };
  });
