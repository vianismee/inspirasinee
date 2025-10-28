"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReferralDashboard } from "@/components/Referral/ReferralDashboard";
import { toast } from "sonner";
import { ReferralDashboardService, PointsService } from "@/lib/client-services";

interface DashboardData {
  success: boolean;
  customerData: {
    customer_id: string;
    name?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
  };
  pointsData: {
    current_balance: number;
    total_earned: number;
    total_redeemed: number;
  };
  referralCode: string;
  referralStats: {
    totalReferrals: number;
    totalPointsEarned: number;
  };
  transactionHistory: Array<{
    transaction_type: string;
    points_change: number;
    balance_after: number;
    reference_type: string;
    reference_id: string;
    description: string;
    created_at: string;
  }>;
  orderHistory: Array<{
    id: string;
    invoice_id: string;
    customer_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    total_amount: number;
    status: string;
    created_at: string;
    updated_at: string;
    order_items?: Array<{
      id: string;
      product_name: string;
      quantity: number;
      price: number;
      total_price: number;
    }>;
  }>;
}

export default function CustomerDashboardHashPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const hash = params.hash as string;

      if (!hash) {
        setError("Hash tidak valid");
        setIsLoading(false);
        return;
      }

      try {
        // Validate dashboard access using client-side service
        const accessResult = await ReferralDashboardService.validateDashboardAccess(hash);

        if (accessResult.valid && accessResult.customer) {
          console.log("✅ Dashboard access validated");

          // Build dashboard data from validated customer and session
          const dashboardData: DashboardData = {
            success: true,
            customerData: {
              customer_id: accessResult.customer.customer_id,
              name: accessResult.customer.name || '',
              phone: accessResult.customer.phone || '',
              whatsapp: accessResult.customer.whatsapp || '',
              email: accessResult.customer.email || ''
            },
            // Fetch additional data using client-side services
            pointsData: await PointsService.getCustomerBalance(accessResult.customer.customer_id) || {
              current_balance: 0,
              total_earned: 0,
              total_redeemed: 0
            },
            referralCode: accessResult.customer.referral_code || '',
            referralStats: {
              totalReferrals: 0, // TODO: Implement referral stats calculation
              totalPointsEarned: 0 // TODO: Implement referral points calculation
            },
            transactionHistory: [], // TODO: Implement transaction history fetch
            orderHistory: [] // TODO: Implement order history fetch
          };

          setDashboardData(dashboardData);
        } else {
          setError(accessResult.error || "Gagal mengakses dashboard");
          toast.error(accessResult.error || "Link tidak valid atau telah kedaluwarsa");

          // Redirect back to verification page after a delay
          setTimeout(() => {
            router.push("/customer-dashboard");
          }, 3000);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Terjadi kesalahan saat memuat dashboard");
        toast.error("Terjadi kesalahan. Silakan coba lagi");

        setTimeout(() => {
          router.push("/customer-dashboard");
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [params.hash, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-white relative flex items-center justify-center">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(229,231,235,0.8) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(229,231,235,0.8) 1px, transparent 1px),
              radial-gradient(circle 500px at 20% 80%, rgba(139,92,246,0.3), transparent),
              radial-gradient(circle 500px at 80% 20%, rgba(59,130,246,0.3), transparent)
            `,
            backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%",
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-white relative flex items-center justify-center">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(229,231,235,0.8) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(229,231,235,0.8) 1px, transparent 1px),
              radial-gradient(circle 500px at 20% 80%, rgba(139,92,246,0.3), transparent),
              radial-gradient(circle 500px at 80% 20%, rgba(59,130,246,0.3), transparent)
            `,
            backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%",
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-4 p-8 bg-white rounded-lg shadow-lg max-w-md mx-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800">Akses Gagal</h2>
          <p className="text-gray-600 text-center">{error}</p>
          <p className="text-sm text-gray-500 text-center">Mengarahkan kembali ke halaman verifikasi...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">Loading...</h2>
        </div>
      </div>
    );
  }

  return <ReferralDashboard data={dashboardData} />;
}