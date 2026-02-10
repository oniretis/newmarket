import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import AdminCouponsTemplate from "@/components/templates/admin/admin-coupons-template";
import { adminGetCoupons, adminToggleCouponStatus } from "@/lib/functions/admin/coupons";
import type { Coupon, CouponFormValues } from "@/types/coupon";

export const Route = createFileRoute("/(admin)/admin/coupons/")({
  component: AdminCouponsPage,
});

function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminGetCoupons({
        data: {
          limit: 50,
          offset: 0,
        },
      });
      setCoupons(response.coupons);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load coupons");
      console.error("Failed to load coupons:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCouponStatusChange = async (
    couponId: string,
    newStatus: "active" | "expired" | "inactive"
  ) => {
    try {
      await adminToggleCouponStatus({
        data: {
          couponId,
          status: newStatus,
        },
      });
      
      // Update local state
      setCoupons(
        coupons.map((coupon) =>
          coupon.id === couponId ? { ...coupon, status: newStatus } : coupon
        )
      );
    } catch (err) {
      console.error("Failed to update coupon status:", err);
      // Optionally show error toast here
    }
  };

  const handleAddCoupon = async (data: CouponFormValues) => {
    // This would typically open a dialog to create a new coupon
    // For now, we'll just reload the coupons to show any new ones
    await loadCoupons();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading coupons...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-lg text-red-600 mb-4">Error: {error}</div>
        <button
          onClick={loadCoupons}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <AdminCouponsTemplate
      coupons={coupons}
      onCouponStatusChange={handleCouponStatusChange}
      onAddCoupon={handleAddCoupon}
    />
  );
}
