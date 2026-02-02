"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Copy, Gift } from "lucide-react";
import { toast } from "sonner";
import { ReferralData } from "@/types/tracking";

interface ReferralCardProps {
  referralData: ReferralData | null;
}

export function ReferralCard({ referralData }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    if (!referralData?.code) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(referralData.code);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = referralData.code;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Kode referral berhasil disalin!");
    } catch (error) {
      toast.error("Gagal menyalin. Silakan coba lagi");
    }
  };

  const formatPoints = (points: number) => {
    return new Intl.NumberFormat("id-ID").format(points);
  };

  // No referral code state
  if (!referralData) {
    return (
      <Card className="shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <Gift className="w-5 h-5" />
            Kode Referral Kamu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Gift className="w-12 h-12 mx-auto mb-3 text-purple-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Anda belum memiliki kode referral undangan
            </p>
            <Button
              onClick={() => (window.location.href = "/customer-dashboard")}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Dapatkan Kode Referral
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 border-purple-200 dark:border-purple-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
          <Gift className="w-5 h-5" />
          Kode Referral Kamu
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Referral Code Display */}
          <div className="bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-700 p-4 rounded-lg">
            <div className="text-lg font-mono font-bold text-purple-800 dark:text-purple-200 text-center mb-3 tracking-wider">
              {referralData.code}
            </div>
            <Button
              onClick={copyToClipboard}
              className={`w-full ${
                copied
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              <Copy className="w-4 h-4 mr-2" />
              {copied ? "Tersalin!" : "Salin Kode Referral"}
            </Button>
          </div>

          {/* Referral Stats */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total Referrals */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center shadow-sm">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {referralData.totalReferrals}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Total Referral
              </p>
            </div>

            {/* Points from Referrals */}
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center shadow-sm">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                +{formatPoints(referralData.totalPointsEarned)}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                Poin dari Referral
              </p>
            </div>
          </div>

          {/* Encouraging message */}
          <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
            <p className="text-xs text-purple-800 dark:text-purple-200 text-center">
              Bagikan kode referral Anda kepada teman dan dapatkan poin ekstra!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
