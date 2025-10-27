"use client";

import { useState } from "react";
import { useCustomerStore } from "@/stores/customerStore";
import { useCartStore } from "@/stores/cartStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Gift, CheckCircle, AlertCircle } from "lucide-react";
import { formatedCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface ReferralData {
  valid: boolean;
  referrer_customer_id?: string;
  discount_amount?: number;
  points_awarded?: number;
  error?: string;
}

export function Referral() {
  const [referralCode, setReferralCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);

  const activeCustomer = useCustomerStore((state) => state.activeCustomer);
  const {
    referralDiscount,
    setReferralDiscount,
    clearReferralDiscount,
    referralCode: appliedReferralCode,
    setReferralCode: setAppliedReferralCode
  } = useCartStore();

  const validateReferralCode = async () => {
    if (!referralCode.trim() || !activeCustomer) {
      toast.error("Please enter a referral code");
      return;
    }

    console.log("Validating referral code:", {
      referralCode: referralCode.trim(),
      customerId: activeCustomer.customer_id,
      customerName: activeCustomer.username
    });

    setIsValidating(true);
    try {
      console.log("Sending request to /api/referral/validate");

      const requestBody = {
        referralCode: referralCode.trim(),
        customerId: activeCustomer.customer_id,
      };

      console.log("Request body:", requestBody);

      const response = await fetch("/api/referral/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response received:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error:", response.status, errorText);
        toast.error(`Server error: ${response.status}`);
        return;
      }

      const data = await response.json();

      console.log("Referral validation response:", data);

      if (data.valid) {
        setReferralData(data);
        setReferralDiscount(data.discount_amount || 0);
        setAppliedReferralCode(referralCode.trim());
        toast.success(`Referral code applied! You saved ${formatedCurrency(data.discount_amount || 0)}`);
      } else {
        setReferralData(data);
        toast.error(data.error || "Invalid referral code");
      }
    } catch (error) {
      console.error("Error validating referral code:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to validate referral code";
      toast.error(errorMessage);
    } finally {
      setIsValidating(false);
    }
  };

  const clearReferral = () => {
    setReferralCode("");
    setReferralData(null);
    clearReferralDiscount();
    setAppliedReferralCode("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      validateReferralCode();
    }
  };

  // If referral is already applied, show applied state
  if (appliedReferralCode && referralDiscount > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Referral Discount
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">
                  Referral Code Applied
                </p>
                <p className="text-sm text-green-600">
                  Code: {appliedReferralCode}
                </p>
                <p className="text-sm text-green-600">
                  Discount: {formatedCurrency(referralDiscount)}
                </p>
                {referralData?.points_awarded && (
                  <p className="text-xs text-green-500">
                    Referrer earned {referralData.points_awarded} points
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={clearReferral}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Referral Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="referralCode">Enter Referral Code</Label>
          <div className="flex gap-2">
            <Input
              id="referralCode"
              placeholder="Enter referral code..."
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isValidating}
            />
            <Button
              onClick={validateReferralCode}
              disabled={!referralCode.trim() || isValidating}
            >
              {isValidating ? "Validating..." : "Apply"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter a referral code to get a discount on your order
          </p>
        </div>

        {referralData && (
          <div className={`rounded-md border p-3 ${
            referralData.valid
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}>
            <div className="flex items-start gap-2">
              {referralData.valid ? (
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                {referralData.valid ? (
                  <>
                    <p className="font-semibold text-green-800">
                      Referral Code Valid!
                    </p>
                    <p className="text-sm text-green-600">
                      You'll save {formatedCurrency(referralData.discount_amount || 0)}
                    </p>
                    {referralData.points_awarded && (
                      <p className="text-xs text-green-500">
                        Your referrer will earn {referralData.points_awarded} points
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-red-800">
                      Invalid Referral Code
                    </p>
                    <p className="text-sm text-red-600">
                      {referralData.error || "This referral code is not valid"}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}