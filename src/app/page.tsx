"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { Search, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleTrackingClick = () => {
    router.push("/tracking");
  };

  const handleDashboardClick = () => {
    router.push("/customer-dashboard");
  };

  return (
    <main
      className="absolute inset-0 min-h-screen w-full p-4 sm:p-6 md:p-8 pt-12 pb-16 sm:pt-16 sm:pb-20 md:pt-20 md:pb-24"
      style={{
        backgroundImage: `
            linear-gradient(to right, rgba(229,231,235,0.8) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(229,231,235,0.8) 1px, transparent 1px),
            radial-gradient(circle 500px at 20% 80%, rgba(139,92,246,0.3), transparent),
            radial-gradient(circle 500px at 80% 20%, rgba(59,130,246,0.3), transparent)
          `,
        backgroundSize: "48px 48px, 48px 48px, 100% 100%, 100% 100%",
      }}
    >
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col items-center gap-4 mb-12">
          <Logo size={12} className="scale-120" />
        </header>

        <div className="flex flex-col items-center justify-center text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Selamat Datang di
            <span className="block text-blue-600">INSPIRASINEE</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl">
            Layanan cuci sepatu terbaik di Kota Malang. Kualitas premium, hasil memuaskan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-bold">Lacak Pesanan</CardTitle>
              <CardDescription>
                Cek status pesanan Anda dengan mudah menggunakan nomor invoice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleTrackingClick}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <Search className="w-4 h-4 mr-2" />
                Lacak Pesanan
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-xl font-bold">Dashboard Pelanggan</CardTitle>
              <CardDescription>
                Akses riwayat pesanan dan kelola akun pelanggan Anda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleDashboardClick}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <User className="w-4 h-4 mr-2" />
                Dashboard Pelanggan
              </Button>
            </CardContent>
          </Card>
        </div>

  
      </div>
    </main>
  );
}
