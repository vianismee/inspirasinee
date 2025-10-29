"use client";

import Link from "next/link";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Search, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Logo } from "../Logo";

export function TrackingSearch() {
  const [isInvoice, setIsInvoice] = useState<string>("");
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
      {/* 2. Hapus `bg-white` dan tambahkan `relative` agar `z-10` berfungsi */}
      <div className="flex flex-col gap-10 relative z-10 w-full max-w-md p-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="icon" className="hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Logo size={15} className="scale-120" />
          <div className="w-9 h-9" /> {/* Spacer for centering */}
        </div>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Tracking Order kamu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 justify-center">
              <Input
                placeholder="Masukkan Invoice ID"
                className="border-zinc-300"
                onChange={(e) => setIsInvoice(e.target.value)}
              />
              <Link href={`/tracking/${isInvoice}`}>
                <Button size={"icon"}>
                  <Search />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
