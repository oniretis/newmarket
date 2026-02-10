import { createServerFn } from "@tanstack/react-start";
import { db } from "@/lib/db";
import { vendors, shops } from "@/lib/db/schema/shop-schema";
import { count, eq, sum, desc } from "drizzle-orm";
import { adminMiddleware } from "@/lib/middleware/admin";
import { z } from "zod";

export interface TenantWithStats {
  id: string;
  name: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  plan: "free" | "pro" | "enterprise";
  status: "active" | "suspended" | "pending";
  joinedDate: string;
  productCount: number;
  orderCount: number;
}

/**
 * Fetch all tenants (vendors) with their statistics
 */
export const getTenantsWithStats = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async (): Promise<TenantWithStats[]> => {
    const vendorsWithStats = await db
      .select({
        id: vendors.id,
        businessName: vendors.businessName,
        status: vendors.status,
        contactEmail: vendors.contactEmail,
        createdAt: vendors.createdAt,
        userName: vendors.userId, // We'll need to join with users table
        productCount: sum(shops.totalProducts),
        orderCount: sum(shops.totalOrders),
      })
      .from(vendors)
      .leftJoin(shops, eq(vendors.id, shops.vendorId))
      .groupBy(vendors.id, vendors.businessName, vendors.status, vendors.contactEmail, vendors.createdAt, vendors.userId)
      .orderBy(desc(vendors.createdAt));

    // Transform the data to match AdminTenant interface
    return vendorsWithStats.map((vendor) => ({
      id: vendor.id,
      name: vendor.businessName || "Unknown Business",
      slug: vendor.businessName?.toLowerCase().replace(/\s+/g, "-") || "unknown",
      ownerName: "Vendor Name", // We'll need to join with users table to get real name
      ownerEmail: vendor.contactEmail !== null ? vendor.contactEmail : "no-email@example.com",
      plan: "free" as const, // This should come from a subscription table in the future
      status: mapVendorStatus(vendor.status),
      joinedDate: vendor.createdAt.toISOString().split("T")[0],
      productCount: Number(vendor.productCount) || 0,
      orderCount: Number(vendor.orderCount) || 0,
    }));
  });

/**
 * Map vendor status to tenant status
 */
function mapVendorStatus(vendorStatus: string): "active" | "suspended" | "pending" {
  switch (vendorStatus) {
    case "active":
      return "active";
    case "suspended":
      return "suspended";
    case "pending_approval":
    case "pending":
      return "pending";
    default:
      return "pending";
  }
}

/**
 * Get tenant details by ID
 */
export const getTenantById = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ tenantId: z.string() }))
  .handler(async ({ data }) => {
    const { tenantId } = data;

    const vendor = await db.query.vendors.findFirst({
      where: eq(vendors.id, tenantId),
      with: {
        user: {
          columns: {
            name: true,
            email: true,
          },
        },
        shops: {
          columns: {
            id: true,
            name: true,
            slug: true,
            description: true,
            totalProducts: true,
            totalOrders: true,
            status: true,
          },
        },
      },
    });

    if (!vendor) {
      return null;
    }

    const totalProducts = vendor.shops.reduce((sum, shop) => sum + shop.totalProducts, 0);
    const totalOrders = vendor.shops.reduce((sum, shop) => sum + shop.totalOrders, 0);

    return {
      id: vendor.id,
      name: vendor.businessName || "Unknown Business",
      slug: vendor.businessName?.toLowerCase().replace(/\s+/g, "-") || "unknown",
      description: `Business profile for ${vendor.businessName || "Unknown Business"}`,
      owner: {
        name: vendor.user?.name || "Unknown",
        email: vendor.user?.email || vendor.contactEmail !== null ? vendor.contactEmail : "no-email@example.com",
      },
      plan: "free", // This should come from subscription data
      status: mapVendorStatus(vendor.status),
      joinedDate: vendor.createdAt.toISOString().split("T")[0],
      stats: {
        revenue: "$0.00", // This should be calculated from orders
        orders: totalOrders,
        products: totalProducts,
        customers: 0, // This should be calculated from customer data
      },
    };
  });
