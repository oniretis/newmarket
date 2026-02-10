/**
 * Admin Attribute Server Functions
 *
 * Server functions for attribute management in the admin dashboard.
 * Provides access to all attributes across all shops for admin users.
 */

import { createServerFn } from "@tanstack/react-start";
import { count, eq, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { attributes, attributeValues } from "@/lib/db/schema/attribute-schema";
import { shops } from "@/lib/db/schema/shop-schema";
import { productAttributes } from "@/lib/db/schema/products-schema";
import {
  executeAttributeQuery,
  fetchAttributeWithRelations,
} from "@/lib/helper/attribute-query-helpers";
import { adminMiddleware } from "@/lib/middleware/admin";
import {
  createAttributeSchema,
  deleteAttributeSchema,
  getAttributeByIdSchema,
  updateAttributeSchema,
} from "@/lib/validators/shared/attribute-query";
import { createSuccessResponse } from "@/types/api-response";
import type {
  AttributeListResponse,
  CreateAttributeResponse,
  DeleteAttributeResponse,
  UpdateAttributeResponse,
} from "@/types/attributes";

// ============================================================================
// Admin Query Schema
// ============================================================================

const adminAttributesQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
  type: z.enum(["select", "color", "image", "label"]).optional(),
  isActive: z.boolean().optional(),
  shopId: z.string().optional(),
  sortBy: z.enum(["name", "createdAt", "sortOrder"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

// ============================================================================
// Get All Attributes (Admin)
// ============================================================================

export const adminGetAttributes = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(adminAttributesQuerySchema)
  .handler(async ({ data }): Promise<AttributeListResponse> => {
    const {
      limit,
      offset,
      search,
      type,
      isActive,
      shopId,
      sortBy,
      sortDirection,
    } = data;

    // Build base conditions
    const baseConditions = [];
    if (shopId) {
      baseConditions.push(eq(attributes.shopId, shopId));
    }

    // Use shared query helper with admin-specific options
    return executeAttributeQuery({
      baseConditions,
      search,
      type,
      isActive,
      limit,
      offset,
      sortBy: sortBy as any,
      sortDirection,
      includeShopInfo: true,
      includeValues: true,
    });
  });

// ============================================================================
// Get Attribute by ID (Admin)
// ============================================================================

export const adminGetAttributeById = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(getAttributeByIdSchema)
  .handler(async ({ data }) => {
    const { id } = data;

    // Get attribute with shop info
    const attribute = await db.query.attributes.findFirst({
      where: eq(attributes.id, id),
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

    if (!attribute) {
      throw new Error("Attribute not found.");
    }

    // Use shared helper for fetching with relations
    const normalizedAttribute = await fetchAttributeWithRelations(attribute, {
      includeShopInfo: true,
      includeValues: true,
    });

    return { attribute: normalizedAttribute };
  });

// ============================================================================
// Create Attribute (Admin)
// ============================================================================

export const adminCreateAttribute = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(createAttributeSchema)
  .handler(async ({ data }): Promise<CreateAttributeResponse> => {
    const { shopId, values, ...attributeData } = data;

    // Generate slug if not provided
    let slug = attributeData.slug;
    if (!slug) {
      // Generate slug from name
      slug = attributeData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    // Verify shop exists
    const shop = await db.query.shops.findFirst({
      where: eq(shops.id, shopId),
    });

    if (!shop) {
      throw new Error("Shop not found.");
    }

    // Check for duplicate slug within the shop
    const existingAttribute = await db.query.attributes.findFirst({
      where: and(eq(attributes.shopId, shopId), eq(attributes.slug, slug)),
    });

    if (existingAttribute) {
      throw new Error(
        "An attribute with this slug already exists in this shop. Please choose a different name or slug.",
      );
    }

    // Create the attribute
    const attributeId = crypto.randomUUID();

    await db.insert(attributes).values({
      id: attributeId,
      shopId: shopId,
      name: attributeData.name,
      slug: slug,
      type: attributeData.type,
      sortOrder: attributeData.sortOrder ?? 0,
      isActive: attributeData.isActive ?? true,
    });

    // Create attribute values
    if (values && values.length > 0) {
      const valueRecords = values.map((val, index) => ({
        id: crypto.randomUUID(),
        attributeId: attributeId,
        name: val.name,
        slug: val.slug,
        value: val.value,
        sortOrder: index,
      }));

      await db.insert(attributeValues).values(valueRecords);
    }

    // Fetch the created attribute with relations
    const newAttribute = await db.query.attributes.findFirst({
      where: eq(attributes.id, attributeId),
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

    if (!newAttribute) {
      throw new Error("Failed to create attribute.");
    }

    // Use shared helper for fetching with relations
    const normalizedAttribute = await fetchAttributeWithRelations(newAttribute, {
      includeShopInfo: true,
      includeValues: true,
    });

    return {
      ...createSuccessResponse("Attribute created successfully"),
      attribute: normalizedAttribute,
    };
  });

// ============================================================================
// Update Attribute (Admin)
// ============================================================================

export const adminUpdateAttribute = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(updateAttributeSchema)
  .handler(async ({ data }): Promise<UpdateAttributeResponse> => {
    const { id, values, ...updateData } = data;

    // Check if attribute exists
    const existingAttribute = await db.query.attributes.findFirst({
      where: eq(attributes.id, id),
    });

    if (!existingAttribute) {
      throw new Error("Attribute not found.");
    }

    // Check for duplicate slug if slug is being updated
    if (updateData.slug && updateData.slug !== existingAttribute.slug) {
      const slugExists = await db.query.attributes.findFirst({
        where: and(eq(attributes.shopId, existingAttribute.shopId), eq(attributes.slug, updateData.slug)),
      });

      if (slugExists) {
        throw new Error("An attribute with this slug already exists in this shop.");
      }
    }

    // Build update object
    const updateValues: Record<string, any> = {};

    if (updateData.name !== undefined) updateValues.name = updateData.name;
    if (updateData.slug !== undefined) updateValues.slug = updateData.slug;
    if (updateData.type !== undefined) updateValues.type = updateData.type;
    if (updateData.sortOrder !== undefined) updateValues.sortOrder = updateData.sortOrder;
    if (updateData.isActive !== undefined) updateValues.isActive = updateData.isActive;

    // Update the attribute
    if (Object.keys(updateValues).length > 0) {
      await db.update(attributes).set(updateValues).where(eq(attributes.id, id));
    }

    // Update values if provided
    if (values !== undefined) {
      // Delete existing values
      await db.delete(attributeValues).where(eq(attributeValues.attributeId, id));

      // Insert new values
      if (values.length > 0) {
        const valueRecords = values.map((val, index) => ({
          id: crypto.randomUUID(),
          attributeId: id,
          name: val.name,
          slug: val.slug,
          value: val.value,
          sortOrder: index,
        }));

        await db.insert(attributeValues).values(valueRecords);
      }
    }

    // Fetch updated attribute with relations
    const updatedAttribute = await db.query.attributes.findFirst({
      where: eq(attributes.id, id),
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

    if (!updatedAttribute) {
      throw new Error("Failed to update attribute.");
    }

    // Use shared helper for fetching with relations
    const normalizedAttribute = await fetchAttributeWithRelations(updatedAttribute, {
      includeShopInfo: true,
      includeValues: true,
    });

    return {
      ...createSuccessResponse("Attribute updated successfully"),
      attribute: normalizedAttribute,
    };
  });

// ============================================================================
// Delete Attribute (Admin)
// ============================================================================

export const adminDeleteAttribute = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(deleteAttributeSchema)
  .handler(async ({ data }): Promise<DeleteAttributeResponse> => {
    const { id } = data;

    // Check if attribute exists
    const existingAttribute = await db.query.attributes.findFirst({
      where: eq(attributes.id, id),
    });

    if (!existingAttribute) {
      throw new Error("Attribute not found.");
    }

    // Check if attribute is being used by products
    const productCount = await db
      .select({ count: count() })
      .from(productAttributes)
      .where(eq(productAttributes.attributeId, id));

    if (productCount[0]?.count > 0) {
      throw new Error(
        "Cannot delete an attribute that is assigned to products. Please remove it from products first.",
      );
    }

    // Delete the attribute (values will cascade delete)
    await db.delete(attributes).where(eq(attributes.id, id));

    return createSuccessResponse("Attribute deleted successfully");
  });

// ============================================================================
// Toggle Attribute Status (Admin)
// ============================================================================

export const adminToggleAttributeStatus = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(z.object({
    attributeId: z.string(),
    isActive: z.boolean(),
  }))
  .handler(async ({ data }) => {
    const { attributeId, isActive } = data;

    // Check if attribute exists
    const existingAttribute = await db.query.attributes.findFirst({
      where: eq(attributes.id, attributeId),
    });

    if (!existingAttribute) {
      throw new Error("Attribute not found.");
    }

    // Update attribute status
    await db
      .update(attributes)
      .set({ isActive })
      .where(eq(attributes.id, attributeId));

    return createSuccessResponse(`Attribute status updated to ${isActive ? "active" : "inactive"}`);
  });

// ============================================================================
// Get Attribute Stats (Admin)
// ============================================================================

export const adminGetAttributeStats = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async () => {
    const totalAttributes = await db.select({ count: count() }).from(attributes);
    
    const activeAttributes = await db
      .select({ count: count() })
      .from(attributes)
      .where(eq(attributes.isActive, true));

    const inactiveAttributes = await db
      .select({ count: count() })
      .from(attributes)
      .where(eq(attributes.isActive, false));

    // Count by type
    const selectAttributes = await db
      .select({ count: count() })
      .from(attributes)
      .where(eq(attributes.type, "select"));

    const colorAttributes = await db
      .select({ count: count() })
      .from(attributes)
      .where(eq(attributes.type, "color"));

    const imageAttributes = await db
      .select({ count: count() })
      .from(attributes)
      .where(eq(attributes.type, "image"));

    const labelAttributes = await db
      .select({ count: count() })
      .from(attributes)
      .where(eq(attributes.type, "label"));

    return {
      totalAttributes: Number(totalAttributes[0]?.count ?? 0),
      activeAttributes: Number(activeAttributes[0]?.count ?? 0),
      inactiveAttributes: Number(inactiveAttributes[0]?.count ?? 0),
      selectAttributes: Number(selectAttributes[0]?.count ?? 0),
      colorAttributes: Number(colorAttributes[0]?.count ?? 0),
      imageAttributes: Number(imageAttributes[0]?.count ?? 0),
      labelAttributes: Number(labelAttributes[0]?.count ?? 0),
    };
  });
