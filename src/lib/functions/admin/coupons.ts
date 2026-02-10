/**
 * Admin Coupon Server Functions
 *
 * Server functions for coupon management in the admin dashboard.
 * Provides access to all coupons across all shops for admin users.
 */

import { createServerFn } from "@tanstack/react-start";
import { and, count, eq, ilike, lte, gte } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  coupons,
  couponProducts,
  couponCategories,
  couponUsage,
} from "@/lib/db/schema/coupon-schema";
import { shops } from "@/lib/db/schema/shop-schema";
import {
  executeCouponQuery,
  fetchCouponWithRelations,
} from "@/lib/helper/coupon-query-helpers";
import { adminMiddleware } from "@/lib/middleware/admin";
import {
  createCouponSchema,
  deleteCouponSchema,
  getCouponByIdSchema,
  updateCouponSchema,
} from "@/lib/validators/shared/coupon-query";
import { createSuccessResponse } from "@/types/api-response";
import type {
  CouponListResponse,
  CreateCouponResponse,
  DeleteCouponResponse,
  UpdateCouponResponse,
} from "@/types/coupons";

// ============================================================================
// Admin Query Schema
// ============================================================================

const adminCouponsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
  type: z.enum(["percentage", "fixed", "free_shipping"]).optional(),
  status: z.enum(["active", "inactive", "expired", "scheduled"]).optional(),
  isActive: z.boolean().optional(),
  applicableTo: z.enum(["all", "specific_products", "specific_categories"]).optional(),
  shopId: z.string().optional(),
  sortBy: z.enum(["code", "discountAmount", "minimumCartAmount", "usageCount", "activeFrom", "activeTo", "createdAt"]).default("createdAt"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

// ============================================================================
// Get All Coupons (Admin)
// ============================================================================

export const adminGetCoupons = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(adminCouponsQuerySchema)
  .handler(async ({ data }): Promise<CouponListResponse> => {
    const {
      limit,
      offset,
      search,
      type,
      status,
      isActive,
      applicableTo,
      shopId,
      sortBy,
      sortDirection,
    } = data;

    // Build base conditions
    const baseConditions = [];
    if (shopId) {
      baseConditions.push(eq(coupons.shopId, shopId));
    }

    // Use shared query helper with admin-specific options
    return executeCouponQuery({
      baseConditions,
      search,
      type,
      status,
      isActive,
      applicableTo,
      limit,
      offset,
      sortBy: sortBy as any,
      sortDirection,
      includeShopInfo: true,
      includeVendorInfo: true,
    });
  });

// ============================================================================
// Get Coupon by ID (Admin)
// ============================================================================

export const adminGetCouponById = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(getCouponByIdSchema)
  .handler(async ({ context, data }) => {
    const { id } = data;

    // Get coupon with shop and vendor info
    const coupon = await db.query.coupons.findFirst({
      where: eq(coupons.id, id),
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

    if (!coupon) {
      throw new Error("Coupon not found.");
    }

    // Use shared helper for fetching with relations
    const normalizedCoupon = await fetchCouponWithRelations(coupon, {
      includeShopInfo: true,
      includeVendorInfo: true,
    });

    return { coupon: normalizedCoupon };
  });

// ============================================================================
// Create Coupon (Admin)
// ============================================================================

export const adminCreateCoupon = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(createCouponSchema)
  .handler(async ({ context, data }): Promise<CreateCouponResponse> => {
    const { shopId, productIds, categoryIds, ...couponData } = data;

    // Verify shop exists
    const shop = await db.query.shops.findFirst({
      where: eq(shops.id, shopId),
    });

    if (!shop) {
      throw new Error("Shop not found.");
    }

    // Check for duplicate code within the shop
    const existingCoupon = await db.query.coupons.findFirst({
      where: and(
        eq(coupons.shopId, shopId),
        ilike(coupons.code, couponData.code),
      ),
    });

    if (existingCoupon) {
      throw new Error(
        "A coupon with this code already exists in this shop. Please choose a different code.",
      );
    }

    // Parse dates
    const activeFromDate = new Date(couponData.activeFrom);
    const activeToDate = new Date(couponData.activeTo);

    // Create the coupon
    const couponId = crypto.randomUUID();

    await db.insert(coupons).values({
      id: couponId,
      shopId: shopId,
      code: couponData.code,
      description: couponData.description || null,
      image: couponData.image || null,
      type: couponData.type,
      discountAmount: String(couponData.discountAmount),
      minimumCartAmount: String(couponData.minimumCartAmount),
      maximumDiscountAmount: couponData.maximumDiscountAmount
        ? String(couponData.maximumDiscountAmount)
        : null,
      activeFrom: activeFromDate,
      activeTo: activeToDate,
      usageLimit: couponData.usageLimit || null,
      usageLimitPerUser: couponData.usageLimitPerUser ?? 1,
      usageCount: 0,
      isActive: couponData.isActive ?? true,
      applicableTo: couponData.applicableTo ?? "all",
      status: "active",
    });

    // Insert product/category links if applicable
    if (
      couponData.applicableTo === "specific_products" &&
      productIds &&
      productIds.length > 0
    ) {
      const productRecords = productIds.map((productId: string) => ({
        couponId,
        productId,
      }));
      await db.insert(couponProducts).values(productRecords);
    }

    if (
      couponData.applicableTo === "specific_categories" &&
      categoryIds &&
      categoryIds.length > 0
    ) {
      const categoryRecords = categoryIds.map((categoryId: string) => ({
        couponId,
        categoryId,
      }));
      await db.insert(couponCategories).values(categoryRecords);
    }

    // Fetch the created coupon with relations
    const newCoupon = await db.query.coupons.findFirst({
      where: eq(coupons.id, couponId),
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

    if (!newCoupon) {
      throw new Error("Failed to create coupon.");
    }

    // Use shared helper for fetching with relations
    const normalizedCoupon = await fetchCouponWithRelations(newCoupon, {
      includeShopInfo: true,
      includeVendorInfo: true,
    });

    return {
      ...createSuccessResponse("Coupon created successfully"),
      coupon: normalizedCoupon,
    };
  });

// ============================================================================
// Update Coupon (Admin)
// ============================================================================

export const adminUpdateCoupon = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(updateCouponSchema)
  .handler(async ({ context, data }): Promise<UpdateCouponResponse> => {
    const { id, productIds, categoryIds, ...updateData } = data;

    // Check if coupon exists
    const existingCoupon = await db.query.coupons.findFirst({
      where: eq(coupons.id, id),
    });

    if (!existingCoupon) {
      throw new Error("Coupon not found.");
    }

    // Check for duplicate code if code is being updated
    if (updateData.code && updateData.code !== existingCoupon.code) {
      const codeExists = await db.query.coupons.findFirst({
        where: and(
          eq(coupons.shopId, existingCoupon.shopId),
          ilike(coupons.code, updateData.code),
        ),
      });

      if (codeExists) {
        throw new Error("A coupon with this code already exists in this shop.");
      }
    }

    // Build update object
    const updateValues: Record<string, any> = {};

    if (updateData.code !== undefined) updateValues.code = updateData.code;
    if (updateData.description !== undefined)
      updateValues.description = updateData.description;
    if (updateData.image !== undefined)
      updateValues.image = updateData.image || null;
    if (updateData.type !== undefined) updateValues.type = updateData.type;
    if (updateData.discountAmount !== undefined)
      updateValues.discountAmount = String(updateData.discountAmount);
    if (updateData.minimumCartAmount !== undefined)
      updateValues.minimumCartAmount = String(updateData.minimumCartAmount);
    if (updateData.maximumDiscountAmount !== undefined)
      updateValues.maximumDiscountAmount = updateData.maximumDiscountAmount
        ? String(updateData.maximumDiscountAmount)
        : null;
    if (updateData.activeFrom !== undefined)
      updateValues.activeFrom = new Date(updateData.activeFrom);
    if (updateData.activeTo !== undefined)
      updateValues.activeTo = new Date(updateData.activeTo);
    if (updateData.usageLimit !== undefined)
      updateValues.usageLimit = updateData.usageLimit;
    if (updateData.usageLimitPerUser !== undefined)
      updateValues.usageLimitPerUser = updateData.usageLimitPerUser;
    if (updateData.isActive !== undefined)
      updateValues.isActive = updateData.isActive;
    if (updateData.applicableTo !== undefined)
      updateValues.applicableTo = updateData.applicableTo;

    // Update the coupon
    if (Object.keys(updateValues).length > 0) {
      await db.update(coupons).set(updateValues).where(eq(coupons.id, id));
    }

    // Update product/category links
    const newApplicableTo =
      updateData.applicableTo ?? existingCoupon.applicableTo;

    if (
      newApplicableTo === "specific_products" &&
      productIds !== undefined &&
      productIds.length >= 0
    ) {
      await db.delete(couponProducts).where(eq(couponProducts.couponId, id));
      if (productIds.length > 0) {
        const productRecords = productIds.map((productId: string) => ({
          couponId: id,
          productId,
        }));
        await db.insert(couponProducts).values(productRecords);
      }
    }

    if (
      newApplicableTo === "specific_categories" &&
      categoryIds !== undefined &&
      categoryIds.length >= 0
    ) {
      await db
        .delete(couponCategories)
        .where(eq(couponCategories.couponId, id));
      if (categoryIds.length > 0) {
        const categoryRecords = categoryIds.map((categoryId: string) => ({
          couponId: id,
          categoryId,
        }));
        await db.insert(couponCategories).values(categoryRecords);
      }
    }

    // Fetch updated coupon with relations
    const updatedCoupon = await db.query.coupons.findFirst({
      where: eq(coupons.id, id),
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

    if (!updatedCoupon) {
      throw new Error("Failed to update coupon.");
    }

    // Use shared helper for fetching with relations
    const normalizedCoupon = await fetchCouponWithRelations(updatedCoupon, {
      includeShopInfo: true,
      includeVendorInfo: true,
    });

    return {
      ...createSuccessResponse("Coupon updated successfully"),
      coupon: normalizedCoupon,
    };
  });

// ============================================================================
// Delete Coupon (Admin)
// ============================================================================

export const adminDeleteCoupon = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(deleteCouponSchema)
  .handler(async ({ context, data }): Promise<DeleteCouponResponse> => {
    const { id } = data;

    // Check if coupon exists
    const existingCoupon = await db.query.coupons.findFirst({
      where: eq(coupons.id, id),
    });

    if (!existingCoupon) {
      throw new Error("Coupon not found.");
    }

    // Delete the coupon (junction tables will cascade)
    await db.delete(coupons).where(eq(coupons.id, id));

    return createSuccessResponse("Coupon deleted successfully");
  });

// ============================================================================
// Toggle Coupon Status (Admin)
// ============================================================================

export const adminToggleCouponStatus = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(z.object({
    couponId: z.string(),
    status: z.enum(["active", "inactive", "expired"]),
  }))
  .handler(async ({ data }) => {
    const { couponId, status } = data;

    // Check if coupon exists
    const existingCoupon = await db.query.coupons.findFirst({
      where: eq(coupons.id, couponId),
    });

    if (!existingCoupon) {
      throw new Error("Coupon not found.");
    }

    // Update coupon status
    await db
      .update(coupons)
      .set({ 
        status,
        isActive: status === "active"
      })
      .where(eq(coupons.id, couponId));

    return createSuccessResponse(`Coupon status updated to ${status}`);
  });

// ============================================================================
// Get Coupon Stats (Admin)
// ============================================================================

export const adminGetCouponStats = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async () => {
    const totalCoupons = await db.select({ count: count() }).from(coupons);
    
    const activeCoupons = await db
      .select({ count: count() })
      .from(coupons)
      .where(and(eq(coupons.isActive, true), eq(coupons.status, "active")));

    const expiredCoupons = await db
      .select({ count: count() })
      .from(coupons)
      .where(eq(coupons.status, "expired"));

    const totalUsage = await db
      .select({ total: count() })
      .from(couponUsage);

    return {
      totalCoupons: Number(totalCoupons[0]?.count ?? 0),
      activeCoupons: Number(activeCoupons[0]?.count ?? 0),
      expiredCoupons: Number(expiredCoupons[0]?.count ?? 0),
      totalUsage: Number(totalUsage[0]?.total ?? 0),
    };
  });
