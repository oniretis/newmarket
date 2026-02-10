/**
 * Admin Settings Server Functions
 *
 * Server functions for settings management in the admin dashboard.
 * Provides access to platform-wide configuration settings.
 */

import { createServerFn } from "@tanstack/react-start";
import { and, count, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema/settings-schema";
import { adminMiddleware } from "@/lib/middleware/admin";
import { createSuccessResponse } from "@/types/api-response";

// ============================================================================
// Get All Settings (Admin)
// ============================================================================

const adminSettingsQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
  search: z.string().optional(),
  category: z.string().optional(),
  sortBy: z.enum(["key", "value", "category", "updatedAt"]).optional().default("key"),
  sortDirection: z.enum(["asc", "desc"]).optional().default("asc"),
});

export const adminGetSettings = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(adminSettingsQuerySchema.optional())
  .handler(async ({ data }) => {
    const {
      limit = 50,
      offset = 0,
      search,
      category,
      sortBy = "key",
      sortDirection = "asc",
    } = data || {};

    // Build conditions
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          ilike(settings.key, `%${search}%`),
          ilike(settings.value, `%${search}%`),
          ilike(settings.description, `%${search}%`)
        )
      );
    }
    
    if (category) {
      conditions.push(eq(settings.category, category));
    }

    // Get total count
    const totalCountResult = await db
      .select({ count: count() })
      .from(settings)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    const totalCount = Number(totalCountResult[0]?.count ?? 0);

    // Get settings with pagination and sorting
    const settingsData = await db.query.settings.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      limit,
      offset,
      orderBy: (settings, { asc, desc }) => {
        const direction = sortDirection === "asc" ? asc : desc;
        switch (sortBy) {
          case "key":
            return direction(settings.key);
          case "value":
            return direction(settings.value);
          case "category":
            return direction(settings.category);
          case "updatedAt":
            return direction(settings.updatedAt);
          default:
            return direction(settings.key);
        }
      },
    });

    return {
      settings: settingsData,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    };
  });

// ============================================================================
// Get Setting by Key (Admin)
// ============================================================================

export const adminGetSettingByKey = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ key: z.string() }))
  .handler(async ({ data }) => {
    const { key } = data;

    const setting = await db.query.settings.findFirst({
      where: eq(settings.key, key),
    });

    if (!setting) {
      throw new Error(`Setting with key "${key}" not found.`);
    }

    return { setting };
  });

// ============================================================================
// Create/Update Setting (Admin)
// ============================================================================

const createUpdateSettingSchema = z.object({
  key: z.string().min(1).max(255),
  value: z.string().min(1).max(1000),
  description: z.string().max(500).optional(),
  category: z.string().min(1).max(100).default("General"),
});

export const adminCreateUpdateSetting = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(createUpdateSettingSchema)
  .handler(async ({ data }) => {
    const { key, value, description, category } = data;

    // Check if setting already exists
    const existingSetting = await db.query.settings.findFirst({
      where: eq(settings.key, key),
    });

    if (existingSetting) {
      // Update existing setting
      await db
        .update(settings)
        .set({
          value,
          description: description || null,
          category,
          updatedAt: new Date(),
        })
        .where(eq(settings.key, key));

      // Fetch updated setting
      const updatedSetting = await db.query.settings.findFirst({
        where: eq(settings.key, key),
      });

      return {
        ...createSuccessResponse("Setting updated successfully"),
        setting: updatedSetting!,
      };
    } else {
      // Create new setting
      const settingId = crypto.randomUUID();

      await db.insert(settings).values({
        id: settingId,
        key,
        value,
        description: description || null,
        category,
      });

      // Fetch created setting
      const newSetting = await db.query.settings.findFirst({
        where: eq(settings.key, key),
      });

      return {
        ...createSuccessResponse("Setting created successfully"),
        setting: newSetting!,
      };
    }
  });

// ============================================================================
// Delete Setting (Admin)
// ============================================================================

export const adminDeleteSetting = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ key: z.string() }))
  .handler(async ({ data }) => {
    const { key } = data;

    const existingSetting = await db.query.settings.findFirst({
      where: eq(settings.key, key),
    });

    if (!existingSetting) {
      throw new Error(`Setting with key "${key}" not found.`);
    }

    // Delete the setting
    await db.delete(settings).where(eq(settings.key, key));

    return createSuccessResponse("Setting deleted successfully");
  });

// ============================================================================
// Get Settings by Category (Admin)
// ============================================================================

export const adminGetSettingsByCategory = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .inputValidator(z.object({ category: z.string() }))
  .handler(async ({ data }) => {
    const { category } = data;

    const settingsData = await db.query.settings.findMany({
      where: eq(settings.category, category),
      orderBy: (settings, { asc }) => asc(settings.key),
    });

    return { settings: settingsData };
  });

// ============================================================================
// Get All Categories (Admin)
// ============================================================================

export const adminGetSettingCategories = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async () => {
    const categoriesResult = await db
      .selectDistinct({ category: settings.category })
      .from(settings)
      .orderBy(settings.category);

    const categories = categoriesResult.map(row => row.category);

    return { categories };
  });

// ============================================================================
// Bulk Update Settings (Admin)
// ============================================================================

const bulkUpdateSettingsSchema = z.object({
  updates: z.array(z.object({
    key: z.string(),
    value: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
  })),
});

export const adminBulkUpdateSettings = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .inputValidator(bulkUpdateSettingsSchema)
  .handler(async ({ data }) => {
    const { updates } = data;

    const results = [];

    for (const update of updates) {
      try {
        const existingSetting = await db.query.settings.findFirst({
          where: eq(settings.key, update.key),
        });

        if (existingSetting) {
          // Update existing setting
          await db
            .update(settings)
            .set({
              value: update.value,
              description: update.description || existingSetting.description,
              category: update.category || existingSetting.category,
              updatedAt: new Date(),
            })
            .where(eq(settings.key, update.key));

          results.push({ key: update.key, status: "updated", success: true });
        } else {
          // Create new setting
          const settingId = crypto.randomUUID();
          await db.insert(settings).values({
            id: settingId,
            key: update.key,
            value: update.value,
            description: update.description || null,
            category: update.category || "General",
          });

          results.push({ key: update.key, status: "created", success: true });
        }
      } catch (error) {
        results.push({ 
          key: update.key, 
          status: "failed", 
          success: false, 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return {
      ...createSuccessResponse(`Bulk update completed. ${successCount} succeeded, ${failureCount} failed.`),
      results,
    };
  });

// ============================================================================
// Initialize Default Settings (Admin)
// ============================================================================

export const adminInitializeDefaultSettings = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .handler(async () => {
    const defaultSettings = [
      {
        key: "site.name",
        value: "Heywhymarketplace",
        description: "The name of the platform",
        category: "General",
      },
      {
        key: "site.description",
        value: "Multi-vendor e-commerce platform",
        description: "Platform description shown in meta tags",
        category: "General",
      },
      {
        key: "site.contact.email",
        value: "support@Heywhymarketplace.com",
        description: "Primary contact email address",
        category: "Contact",
      },
      {
        key: "site.contact.phone",
        value: "+1 (555) 123-4567",
        description: "Primary contact phone number",
        category: "Contact",
      },
      {
        key: "payment.default.currency",
        value: "USD",
        description: "Default currency for transactions",
        category: "Payment",
      },
      {
        key: "payment.stripe.enabled",
        value: "true",
        description: "Enable Stripe payment gateway",
        category: "Payment",
      },
      {
        key: "shipping.default.method",
        value: "standard",
        description: "Default shipping method",
        category: "Shipping",
      },
      {
        key: "shipping.free.threshold",
        value: "50.00",
        description: "Minimum order value for free shipping",
        category: "Shipping",
      },
      {
        key: "email.smtp.host",
        value: "smtp.gmail.com",
        description: "SMTP server hostname",
        category: "Email",
      },
      {
        key: "email.smtp.port",
        value: "587",
        description: "SMTP server port",
        category: "Email",
      },
      {
        key: "security.session.timeout",
        value: "3600",
        description: "Session timeout in seconds",
        category: "Security",
      },
      {
        key: "security.password.min_length",
        value: "8",
        description: "Minimum password length",
        category: "Security",
      },
    ];

    const results = [];

    for (const setting of defaultSettings) {
      try {
        const existingSetting = await db.query.settings.findFirst({
          where: eq(settings.key, setting.key),
        });

        if (!existingSetting) {
          const settingId = crypto.randomUUID();
          await db.insert(settings).values({
            id: settingId,
            ...setting,
          });
          results.push({ key: setting.key, status: "created", success: true });
        } else {
          results.push({ key: setting.key, status: "exists", success: true });
        }
      } catch (error) {
        results.push({ 
          key: setting.key, 
          status: "failed", 
          success: false, 
          error: error instanceof Error ? error.message : "Unknown error" 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return {
      ...createSuccessResponse(`Default settings initialization completed. ${successCount} succeeded, ${failureCount} failed.`),
      results,
    };
  });
