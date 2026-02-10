import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * Settings Table
 * Stores platform-wide configuration settings.
 * Settings are organized by categories for better management.
 */
export const settings = pgTable("settings", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  category: text("category").notNull().default("General"),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Settings Relations
 */
export const settingsRelations = relations(settings, ({}) => ({}));

// Type exports
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
