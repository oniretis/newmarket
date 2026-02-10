import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import AdminReviewsTemplate from "@/components/templates/admin/admin-reviews-template";
import { getAllReviews } from "@/lib/functions/admin/reviews";
import type { Review } from "@/types/review";

export const Route = createFileRoute("/(admin)/admin/reviews/")({
  component: AdminReviewsPage,
  loader: async () => {
    const reviews = await getAllReviews();
    return { reviews };
  },
});

function AdminReviewsPage() {
  const { reviews: initialReviews } = Route.useLoaderData();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);

  const handleReviewStatusChange = (
    reviewId: string,
    newStatus: "published" | "pending" | "rejected"
  ) => {
    setReviews(
      reviews.map((review) =>
        review.id === reviewId ? { ...review, status: newStatus } : review
      )
    );
  };

  return (
    <AdminReviewsTemplate
      reviews={reviews}
      onReviewStatusChange={handleReviewStatusChange}
    />
  );
}
