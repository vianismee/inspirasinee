"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Copy, Gift, History, User, TrendingUp, AlertCircle, CircleDashed, Hourglass, Sparkles, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Logo } from "../Logo";
import { toast } from "sonner";

interface CustomerData {
  customer_id: string;
  name?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  username?: string;
  customer_name?: string;
  [key: string]: unknown;
}

interface ReferralDashboardProps {
  data: {
    customerData: CustomerData;
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
    orderHistory?: Array<{
      id: string;
      invoice_id: string;
      invoice_number?: string;
      customer_id: string;
      customer_name: string;
      customer_email: string;
      customer_phone: string;
      total_amount: number;
      amount?: number;
      total?: number;
      order_total?: number;
      grand_total?: number;
      final_amount?: number;
      price?: number;
      subtotal?: number;
      status: string;
      created_at: string;
      updated_at: string;
      order_items?: Array<{
        id: string;
        product_name: string;
        quantity: number;
        price: number;
        total_amount: number;
      }>;
    }>;
  };
}

export function ReferralDashboard({ data }: ReferralDashboardProps) {
  const router = useRouter();
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);

  // Status options matching TableJob.tsx
  const statusOptions = [
    {
      value: "ongoing",
      label: "Ongoing",
      variant: "outline" as const,
      icon: CircleDashed,
      className: "",
    },
    {
      value: "pending",
      label: "Pending",
      variant: "secondary" as const,
      icon: Hourglass,
      className: "",
    },
    {
      value: "cleaning",
      label: "Cleaning",
      variant: "default" as const,
      icon: Sparkles,
      className: "",
    },
    {
      value: "finish",
      label: "Finish",
      className: "bg-green-600 hover:bg-green-600/80 text-white",
      icon: CheckCircle2,
    },
    {
      value: "completed",
      label: "Completed",
      className: "bg-green-600 hover:bg-green-600/80 text-white",
      icon: CheckCircle2,
    },
    {
      value: "cancelled",
      label: "Cancelled",
      variant: "destructive" as const,
      icon: AlertCircle,
      className: "",
    },
  ];

  
  const copyToClipboard = async (text: string, type: "referral") => {
    try {
      // Check if the text exists and is not empty
      if (!text || text.trim() === '') {
        toast.error("Tidak ada kode referral untuk disalin");
        return;
      }

      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (!successful) {
          throw new Error('Fallback copy method failed');
        }
      }

      if (type === "referral") {
        setCopiedReferral(true);
        setTimeout(() => setCopiedReferral(false), 2000);
      }

      toast.success("Kode referral berhasil disalin!");

    } catch (error) {
      toast.error("Gagal menyalin. Silakan coba lagi");
    }
  };

  const formatPoints = (points: number) => {
    return new Intl.NumberFormat("id-ID").format(points);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date(dateString));
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "Tidak tersedia";

    if (showSensitiveInfo) {
      // Convert +62 to 0 and show full number
      return phone.replace(/^\+62/, '0');
    } else {
      // Convert +62 to 0 and hide like password
      const normalizedPhone = phone.replace(/^\+62/, '0');
      return `••••••••${normalizedPhone.slice(-2)}`;
    }
  };

  const formatEmail = (email: string) => {
    if (!email) return "Tidak tersedia";

    if (showSensitiveInfo) {
      // Show full email
      return email;
    } else {
      // Hide email like password
      const [username, domain] = email.split('@');
      if (!username || !domain) return "••••••••••••";

      const visibleChars = Math.min(2, username.length);
      const hiddenUsername = '•'.repeat(username.length - visibleChars) + username.slice(-visibleChars);
      return `${hiddenUsername}@${domain}`;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "earned":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "redeemed":
        return <Gift className="w-4 h-4 text-red-500" />;
      default:
        return <History className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "earned":
        return "text-green-600 bg-green-50 border-green-200";
      case "redeemed":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusBadge = (status: string) => {
    const currentStatus = statusOptions.find((s) => s.value === status);
    if (!currentStatus) {
      return (
        <Badge variant="outline" className="text-gray-600">
          {status || 'Unknown'}
        </Badge>
      );
    }
    const Icon = currentStatus.icon;
    return (
      <Badge
        variant={currentStatus.variant}
        className={`${currentStatus.className} flex items-center gap-1.5`}
      >
        <Icon className="h-3 w-3" />
        {currentStatus.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen w-full bg-white relative">
      {/* Background gradient pattern matching tracking page */}
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

      <div className="relative z-10 w-full max-w-md mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <div className="flex justify-center mb-4">
            <Logo size={15} className="scale-120" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Referral Kamu</h1>
          <p className="text-gray-600">Kelola poin dan lihat riwayat referral</p>
        </div>

        
        {/* Points Balance Card */}
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {formatPoints(data.pointsData.current_balance)}
              </div>
              <div className="text-sm text-gray-600 mb-4">Points Balance</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-green-700 font-medium">
                    +{formatPoints(data.pointsData.total_earned)}
                  </div>
                  <div className="text-green-600">Total Earned</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-red-700 font-medium">
                    -{formatPoints(data.pointsData.total_redeemed)}
                  </div>
                  <div className="text-red-600">Total Redeemed</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Code Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gift className="w-5 h-5 text-purple-600" />
              Kode Referral Kamu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-purple-50 border-2 border-purple-200 p-4 rounded-lg">
                <div className="text-lg font-mono font-bold text-purple-800 text-center mb-3">
                  {data.referralCode}
                </div>
                <Button
                  onClick={() => copyToClipboard(data.referralCode, "referral")}
                  className={`w-full ${copiedReferral ? "bg-green-600 hover:bg-green-700" : "bg-purple-600 hover:bg-purple-700"}`}
                >
                  {copiedReferral ? (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Salin Kode Referral
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {data.referralStats.totalReferrals}
                  </div>
                  <div className="text-xs text-blue-600">Total Referral</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatPoints(data.referralStats.totalPointsEarned)}
                  </div>
                  <div className="text-xs text-green-600">Poin dari Referral</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Info Card */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-blue-600" />
                Info Profil
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                className="h-8 w-8 p-0 hover:bg-gray-100"
                title={showSensitiveInfo ? "Sembunyikan info sensitif" : "Tampilkan info sensitif"}
              >
                {showSensitiveInfo ? (
                  <EyeOff className="w-4 h-4 text-gray-600" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-600" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Nama Customer</span>
                <span className="font-medium text-sm">{data.customerData.username || data.customerData.customer_name || 'Tidak tersedia'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Nomor Telepon</span>
                <span className={`font-medium text-gray-700 ${showSensitiveInfo ? '' : 'select-none'}`}>
                  {formatPhoneNumber(data.customerData.phone || '-')}
                </span>
              </div>
              {data.customerData.email && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Email</span>
                  <span className={`font-medium text-sm ${showSensitiveInfo ? '' : 'select-none'}`}>
                    {formatEmail(data.customerData.email)}
                  </span>
                </div>
              )}
              {typeof data.customerData.created_at === 'string' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Bergabung Sejak</span>
                  <span className="font-medium text-sm">
                    {formatDate(data.customerData.created_at)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order History */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="w-5 h-5 text-blue-600" />
              Riwayat Pesanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.orderHistory && data.orderHistory.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {data.orderHistory.map((order, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg border border-gray-200 bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Invoice Number */}
                        <div>
                          <div className="font-medium text-sm text-gray-900">
                            {order.invoice_id || order.invoice_number || `INV-${order.id}`}
                          </div>
                        </div>

                        {/* Status Badge */}
                        {getStatusBadge(order.status || 'Unknown')}
                      </div>

                      {/* Total Amount */}
                      <div className="text-right">
                        <div className="font-bold text-sm text-gray-900">
                          {formatPoints(
                            order.total_amount ||
                            order.amount ||
                            order.total ||
                            order.order_total ||
                            order.grand_total ||
                            order.final_amount ||
                            order.price ||
                            order.subtotal ||
                            0
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Belum ada riwayat pesanan</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Points Transaction History */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Riwayat Poin
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.transactionHistory.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {data.transactionHistory.map((transaction, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${getTransactionColor(transaction.transaction_type)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        {getTransactionIcon(transaction.transaction_type)}
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {transaction.description}
                          </div>
                          <div className="text-xs opacity-75 mt-1">
                            {formatDate(transaction.created_at)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm">
                          {transaction.transaction_type === "earned" ? "+" : ""}
                          {formatPoints(transaction.points_change)} pts
                        </div>
                        <div className="text-xs opacity-75">
                          Saldo: {formatPoints(transaction.balance_after)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Belum ada riwayat poin</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => router.push("/")}
            className="w-full bg-gray-600 hover:bg-gray-700"
          >
            Kembali ke Beranda
          </Button>
          <Button
            onClick={() => router.push("/customer-dashboard")}
            variant="outline"
            className="w-full"
          >
            Verifikasi Nomor Lain
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center py-4 text-xs text-gray-500">
          <p>© 2024 Inspirasinee. Dashboard Referral System.</p>
        </div>
      </div>
    </div>
  );
}