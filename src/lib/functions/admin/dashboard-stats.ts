import { createServerFn } from "@tanstack/react-start";
import { count, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema/auth-schema";
import { shops, vendors } from "@/lib/db/schema/shop-schema";
import { products } from "@/lib/db/schema/products-schema";
import { adminMiddleware } from "@/lib/middleware/admin";

export interface DashboardStats {
  totalTenants: number;
  totalUsers: number;
  totalShops: number;
  totalProducts: number;
  tenantsChange: number;
  usersChange: number;
  shopsChange: number;
  productsChange: number;
}

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async (): Promise<DashboardStats> => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    // Execute parallel queries for current and previous month stats
    const [
      currentTenantsResult,
      lastMonthTenantsResult,
      currentUsersResult,
      lastMonthUsersResult,
      currentShopsResult,
      lastMonthShopsResult,
      currentProductsResult,
      lastMonthProductsResult,
    ] = await Promise.all([
      // Current tenants count
      db
        .select({ count: count() })
        .from(vendors)
        .where(eq(vendors.status, 'active')),
      
      // Last month tenants count
      db
        .select({ count: count() })
        .from(vendors)
        .where(eq(vendors.status, 'active')),
      
      // Current users count
      db.select({ count: count() }).from(user),
      
      // Last month users count
      db
        .select({ count: count() })
        .from(user)
        .where(gte(user.createdAt, lastMonth)),
      
      // Current shops count
      db
        .select({ count: count() })
        .from(shops)
        .where(eq(shops.status, 'active')),
      
      // Last month shops count
      db
        .select({ count: count() })
        .from(shops)
        .where(gte(shops.createdAt, lastMonth)),
      
      // Current products count
      db
        .select({ count: count() })
        .from(products)
        .where(eq(products.status, 'active')),
      
      // Last month products count
      db
        .select({ count: count() })
        .from(products)
        .where(gte(products.createdAt, lastMonth)),
    ]);

    const totalTenants = currentTenantsResult[0]?.count ?? 0;
    const lastMonthTenants = lastMonthTenantsResult[0]?.count ?? 0;
    const tenantsChange = totalTenants - lastMonthTenants;

    const totalUsers = currentUsersResult[0]?.count ?? 0;
    const lastMonthUsers = lastMonthUsersResult[0]?.count ?? 0;
    const usersChange = totalUsers - lastMonthUsers;

    const totalShops = currentShopsResult[0]?.count ?? 0;
    const lastMonthShops = lastMonthShopsResult[0]?.count ?? 0;
    const shopsChange = totalShops - lastMonthShops;

    const totalProducts = currentProductsResult[0]?.count ?? 0;
    const lastMonthProducts = lastMonthProductsResult[0]?.count ?? 0;
    const productsChange = totalProducts - lastMonthProducts;

    return {
      totalTenants,
      totalUsers,
      totalShops,
      totalProducts,
      tenantsChange,
      usersChange,
      shopsChange,
      productsChange,
    };
  });
