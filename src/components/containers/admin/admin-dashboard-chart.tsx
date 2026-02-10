import { createServerFn } from "@tanstack/react-start";
import { and, count, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema/auth-schema";
import { shops, vendors } from "@/lib/db/schema/shop-schema";
import { products } from "@/lib/db/schema/products-schema";
import { adminMiddleware } from "@/lib/middleware/admin";

export interface ChartDataPoint {
  month: string;
  users: number;
  tenants: number;
  shops: number;
  products: number;
}

export const getDashboardChartData = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async (): Promise<ChartDataPoint[]> => {
    const now = new Date();
    const chartData: ChartDataPoint[] = [];

    // Generate data for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const [
        usersResult,
        tenantsResult,
        shopsResult,
        productsResult,
      ] = await Promise.all([
        // Users created in this month
        db
          .select({ count: count() })
          .from(user)
          .where(
            and(
              gte(user.createdAt, monthStart),
              sql`${user.createdAt} <= ${monthEnd}`
            )
          ),
        
        // Tenants created in this month
        db
          .select({ count: count() })
          .from(vendors)
          .where(
            and(
              gte(vendors.createdAt, monthStart),
              sql`${vendors.createdAt} <= ${monthEnd}`
            )
          ),
        
        // Shops created in this month
        db
          .select({ count: count() })
          .from(shops)
          .where(
            and(
              gte(shops.createdAt, monthStart),
              sql`${shops.createdAt} <= ${monthEnd}`
            )
          ),
        
        // Products created in this month
        db
          .select({ count: count() })
          .from(products)
          .where(
            and(
              gte(products.createdAt, monthStart),
              sql`${products.createdAt} <= ${monthEnd}`
            )
          ),
      ]);

      const monthName = monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      chartData.push({
        month: monthName,
        users: usersResult[0]?.count ?? 0,
        tenants: tenantsResult[0]?.count ?? 0,
        shops: shopsResult[0]?.count ?? 0,
        products: productsResult[0]?.count ?? 0,
      });
    }

    return chartData;
  });
