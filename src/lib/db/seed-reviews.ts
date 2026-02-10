/**
 * Seed Reviews
 *
 * This script seeds the reviews table with sample data for testing.
 */

import { db } from "@/lib/db";
import { reviews } from "@/lib/db/schema/reviews-schema";
import { products } from "@/lib/db/schema/products-schema";
import { user } from "@/lib/db/schema/auth-schema";
import { eq } from "drizzle-orm";

async function seedReviews() {
  try {
    console.log("Seeding reviews...");

    // Get some sample products and users
    const sampleProducts = await db.select().from(products).limit(5);
    const sampleUsers = await db.select().from(user).limit(3);

    if (sampleProducts.length === 0 || sampleUsers.length === 0) {
      console.log("No products or users found. Please seed them first.");
      return;
    }

    const sampleReviews = [
      {
        productId: sampleProducts[0]?.id || "1",
        userId: sampleUsers[0]?.id || "1",
        rating: 5,
        title: "Amazing product!",
        comment: "This is exactly what I was looking for. Great quality and fast shipping.",
        status: "published" as const,
        isVerifiedPurchase: true,
      },
      {
        productId: sampleProducts[0]?.id || "1",
        userId: sampleUsers[1]?.id || "2",
        rating: 4,
        title: "Good value",
        comment: "Overall satisfied with the purchase. Minor issues with packaging but product itself is great.",
        status: "published" as const,
        isVerifiedPurchase: true,
      },
      {
        productId: sampleProducts[1]?.id || "2",
        userId: sampleUsers[2]?.id || "3",
        rating: 2,
        title: "Not as expected",
        comment: "The product doesn't match the description. Quality could be better.",
        status: "pending" as const,
        isVerifiedPurchase: false,
      },
      {
        productId: sampleProducts[1]?.id || "2",
        userId: sampleUsers[0]?.id || "1",
        rating: 1,
        title: "Terrible experience",
        comment: "Product broke after one day of use. Very disappointed.",
        status: "rejected" as const,
        isVerifiedPurchase: false,
      },
      {
        productId: sampleProducts[2]?.id || "3",
        userId: sampleUsers[1]?.id || "2",
        rating: 5,
        title: "Perfect!",
        comment: "Exceeded my expectations. Will definitely buy again.",
        status: "published" as const,
        isVerifiedPurchase: true,
      },
    ];

    // Insert the reviews
    for (const review of sampleReviews) {
      await db.insert(reviews).values(review);
    }

    console.log("✅ Reviews seeded successfully!");
  } catch (error) {
    console.error("Error seeding reviews:", error);
  }
}

// Run the seed function
seedReviews();
