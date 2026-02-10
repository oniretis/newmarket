/**
 * Staff Schema
 *
 * Database schema for staff members in the marketplace.
 * Staff can have different roles: admin, manager, or staff.
 */

import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

/**
 * Staff Table
 * Stores staff member information and roles.
 */
export const staff = pgTable("staff", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["admin", "manager", "staff"] }).notNull().default("staff"),
  status: text("status", { enum: ["active", "invited", "inactive"] }).notNull().default("active"),
  joinedDate: timestamp("joined_date").defaultNow().notNull(),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

/**
 * Relations
 */
export const staffRelations = relations(staff, ({ one }) => ({
  user: one(user, {
    fields: [staff.userId],
    references: [user.id],
  }),
}));

export const userRelations = relations(user, () => ({
  // Add any relations from user to staff if needed
}));

// Type exports
export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;
