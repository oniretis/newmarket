import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema/auth-schema";
import { shops, vendors } from "@/lib/db/schema/shop-schema";
import { products } from "@/lib/db/schema/products-schema";
import { adminMiddleware } from "@/lib/middleware/admin";

export interface ActivityItem {
  id: string;
  type: 'user' | 'tenant' | 'shop' | 'product';
  action: 'created' | 'updated';
  title: string;
  description: string;
  timestamp: Date;
  userName?: string;
  userEmail?: string;
}

export const getRecentActivity = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async (): Promise<ActivityItem[]> => {
    const activities: ActivityItem[] = [];

    // Get recent users (last 5)
    const recentUsers = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt))
      .limit(5);

    recentUsers.forEach((user) => {
      activities.push({
        id: `user-${user.id}`,
        type: 'user',
        action: 'created',
        title: 'New User Registered',
        description: `${user.name} joined the platform`,
        timestamp: user.createdAt,
        userName: user.name,
        userEmail: user.email,
      });
    });

    // Get recent tenants (vendors) (last 5)
    const recentTenants = await db
      .select({
        id: vendors.id,
        businessName: vendors.businessName,
        status: vendors.status,
        createdAt: vendors.createdAt,
        user: {
          name: user.name,
          email: user.email,
        },
      })
      .from(vendors)
      .leftJoin(user, eq(vendors.userId, user.id))
      .orderBy(desc(vendors.createdAt))
      .limit(5);

    recentTenants.forEach((tenant) => {
      activities.push({
        id: `tenant-${tenant.id}`,
        type: 'tenant',
        action: 'created',
        title: 'New Tenant Applied',
        description: `${tenant.businessName || 'New Business'} applied as vendor`,
        timestamp: tenant.createdAt,
        userName: tenant.user?.name,
        userEmail: tenant.user?.email,
      });
    });

    // Get recent shops (last 5)
    const recentShops = await db
      .select({
        id: shops.id,
        name: shops.name,
        status: shops.status,
        createdAt: shops.createdAt,
        vendor: {
          businessName: vendors.businessName,
        },
        user: {
          name: user.name,
          email: user.email,
        },
      })
      .from(shops)
      .leftJoin(vendors, eq(shops.vendorId, vendors.id))
      .leftJoin(user, eq(vendors.userId, user.id))
      .orderBy(desc(shops.createdAt))
      .limit(5);

    recentShops.forEach((shop) => {
      activities.push({
        id: `shop-${shop.id}`,
        type: 'shop',
        action: 'created',
        title: 'New Shop Created',
        description: `${shop.name} by ${shop.vendor?.businessName || 'Vendor'}`,
        timestamp: shop.createdAt,
        userName: shop.user?.name,
        userEmail: shop.user?.email,
      });
    });

    // Get recent products (last 5)
    const recentProducts = await db
      .select({
        id: products.id,
        name: products.name,
        status: products.status,
        sellingPrice: products.sellingPrice,
        createdAt: products.createdAt,
        shop: {
          name: shops.name,
        },
      })
      .from(products)
      .leftJoin(shops, eq(products.shopId, shops.id))
      .orderBy(desc(products.createdAt))
      .limit(5);

    recentProducts.forEach((product) => {
      activities.push({
        id: `product-${product.id}`,
        type: 'product',
        action: 'created',
        title: 'New Product Added',
        description: `${product.name} - $${product.sellingPrice}`,
        timestamp: product.createdAt,
      });
    });

    // Sort all activities by timestamp (most recent first) and limit to 10
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  });
