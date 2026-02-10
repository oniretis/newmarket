/**
 * Reviews Schema
 *
 * Database schema for product reviews in the multi-vendor marketplace.
 * Reviews are linked to products and users with status management.
 */

import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { products } from "./products-schema";
import { user } from "./auth-schema";

// ============================================================================
// Enums
// ============================================================================

export const reviewStatusEnum = pgEnum("review_status", [
  "pending",
  "published",
  "rejected",
]);

// ============================================================================
// Reviews Table
// ============================================================================

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  
  // Review content
  rating: integer("rating").notNull(),
  title: text("title"),
  comment: text("comment"),
  
  // Status and moderation
  status: reviewStatusEnum("status").notNull().default("pending"),
  isVerifiedPurchase: boolean("is_verified_purchase").default(false),
  
  // Moderation
  moderatedBy: text("moderated_by").references(() => user.id),
  moderatedAt: timestamp("moderated_at"),
  moderationNote: text("moderation_note"),
  
  // Metadata
  helpfulVotes: integer("helpful_votes").default(0),
  totalVotes: integer("total_votes").default(0),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// ============================================================================
// Relations
// ============================================================================

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  user: one(user, {
    fields: [reviews.userId],
    references: [user.id],
  }),
  moderator: one(user, {
    fields: [reviews.moderatedBy],
    references: [user.id],
  }),
}));

// ============================================================================
// Type Exports
// ============================================================================

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
