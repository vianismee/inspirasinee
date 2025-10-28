"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Logo } from "../Logo";
import { PhoneInput } from "../ui/phone-input";
import { toast } from "sonner";
import { createCustomerDashboardLink } from "@/lib/customer-dashboard-hash";
import { createClient } from "@/utils/supabase/client";

export function PhoneVerification() {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone || phone.trim() === "") {
      toast.error("Nomor WhatsApp harus diisi");
      return;
    }

    // Basic phone validation
    if (!phone || phone.length < 10) {
      toast.error("Format nomor telepon tidak valid");
      return;
    }

    setIsLoading(true);

    try {
      // Clean phone number but keep the + prefix for database consistency
      const cleanPhone = phone.startsWith('+') ? phone : '+' + phone.replace(/\D/g, '');

      // Check if customer exists in database
      const supabase = createClient();
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('customer_id, username, whatsapp')
        .eq('whatsapp', cleanPhone)
        .single();

      if (customerError || !customerData) {
        toast.error("Pelanggan tidak ditemukan untuk nomor telepon ini");
        return;
      }

      // Generate dashboard link with encoded phone number
      const dashboardLink = createCustomerDashboardLink(cleanPhone);

      console.log("✅ Customer verified, redirecting to:", dashboardLink);
      toast.success("Verifikasi berhasil! Mengarahkan ke dashboard...");

      // Redirect to dashboard with encoded phone
      router.push(dashboardLink);
    } catch (error) {
      console.error("Error verifying phone:", error);
      toast.error("Terjadi kesalahan. Silakan coba lagi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = () => {
    // Trigger form submission when button is clicked
    const form = document.getElementById('phone-form') as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    }
  };

  return (
    <div className="min-h-screen w-full bg-white relative flex items-center justify-center">
      {/* Background gradient pattern EXACTLY matching tracking page */}
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

      {/* Content container EXACTLY matching tracking page structure */}
      <div className="flex flex-col gap-10 relative z-10 w-full max-w-md p-4">
        <Logo size={15} className="scale-120" />

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Akses Dashboard Referral Kamu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form id="phone-form" onSubmit={handleSubmit}>
              <div className="flex gap-2 justify-center">
                <PhoneInput
                  placeholder="Masukkan Nomor WhatsApp"
                  className="border-zinc-300"
                  value={phone}
                  onChange={setPhone}
                  defaultCountry="ID"
                  disabled={isLoading}
                />
                <Button
                  size={"icon"}
                  onClick={handleButtonClick}
                  disabled={isLoading}
                  type="button"
                >
                  <Search />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Instructions card matching tracking page style */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center text-lg">
              Cara Mengakses Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-blue-600">1.</span>
                <span>Masukkan nomor WhatsApp kamu yang terdaftar</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">2.</span>
                <span>Klik tombol search untuk verifikasi</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">3.</span>
                <span>Akses dashboard referral kamu</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}