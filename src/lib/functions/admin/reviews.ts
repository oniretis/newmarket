/**
 * Admin Reviews Functions
 *
 * Server-side functions for managing reviews in the admin panel.
 */

import { db } from "@/lib/db";
import { reviews } from "@/lib/db/schema/reviews-schema";
import { products } from "@/lib/db/schema/products-schema";
import { user } from "@/lib/db/schema/auth-schema";
import { eq, desc } from "drizzle-orm";
import type { Review } from "@/types/review";

/**
 * Fetch all reviews with product and user information
 */
export async function getAllReviews(): Promise<Review[]> {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL not configured. Returning empty reviews list.");
      return [];
    }

    const result = await db
      .select({
        id: reviews.id,
        productId: reviews.productId,
        productName: products.name,
        productImage: products.name, // We'll need to join with product images for real implementation
        customerName: user.name,
        customerAvatar: user.image,
        rating: reviews.rating,
        comment: reviews.comment,
        date: reviews.createdAt,
        status: reviews.status,
      })
      .from(reviews)
      .leftJoin(products, eq(reviews.productId, products.id))
      .leftJoin(user, eq(reviews.userId, user.id))
      .orderBy(desc(reviews.createdAt));

    return result.map((review) => ({
      id: review.id,
      productName: review.productName || "Unknown Product",
      productImage: review.productImage || "https://placehold.co/100?text=Product",
      customerName: review.customerName || "Anonymous",
      customerAvatar: review.customerAvatar,
      rating: review.rating,
      comment: review.comment || "",
      date: review.date.toISOString().split('T')[0],
      status: review.status as "published" | "pending" | "rejected",
    }));
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
}

/**
 * Update review status
 */
export async function updateReviewStatus(
  reviewId: string,
  newStatus: "published" | "pending" | "rejected"
): Promise<boolean> {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL not configured. Cannot update review status.");
      return false;
    }

    await db
      .update(reviews)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, reviewId));

    return true;
  } catch (error) {
    console.error("Error updating review status:", error);
    return false;
  }
}

/**
 * Get reviews by status
 */
export async function getReviewsByStatus(
  status: "published" | "pending" | "rejected"
): Promise<Review[]> {
  try {
    // Check if database is available
    if (!process.env.DATABASE_URL) {
      console.warn("DATABASE_URL not configured. Returning empty reviews list.");
      return [];
    }

    const result = await db
      .select({
        id: reviews.id,
        productId: reviews.productId,
        productName: products.name,
        productImage: products.name,
        customerName: user.name,
        customerAvatar: user.image,
        rating: reviews.rating,
        comment: reviews.comment,
        date: reviews.createdAt,
        status: reviews.status,
      })
      .from(reviews)
      .leftJoin(products, eq(reviews.productId, products.id))
      .leftJoin(user, eq(reviews.userId, user.id))
      .where(eq(reviews.status, status))
      .orderBy(desc(reviews.createdAt));

    return result.map((review) => ({
      id: review.id,
      productName: review.productName || "Unknown Product",
      productImage: review.productImage || "https://placehold.co/100?text=Product",
      customerName: review.customerName || "Anonymous",
      customerAvatar: review.customerAvatar,
      rating: review.rating,
      comment: review.comment || "",
      date: review.date.toISOString().split('T')[0],
      status: review.status as "published" | "pending" | "rejected",
    }));
  } catch (error) {
    console.error("Error fetching reviews by status:", error);
    return [];
  }
}
