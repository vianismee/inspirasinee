"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { InfoCustomer } from "./InfoCustomer";
import { useCartStore } from "@/stores/cartStore";
import { formatedCurrency } from "@/lib/utils";
import { MEMBERSHIP_LEVEL_COLORS } from "@/types/membership";
import { Crown, Percent } from "lucide-react";

export function MembershipDisplay() {
  const { membershipLevel, membershipDiscount, membershipLevelData } = useCartStore();

  // Don't show if no membership level
  if (!membershipLevel) {
    return null;
  }

  const colors = MEMBERSHIP_LEVEL_COLORS[membershipLevel as keyof typeof MEMBERSHIP_LEVEL_COLORS];
  const hasDiscount = membershipDiscount > 0;
  const discountPercent = membershipLevelData?.discount_percent || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Membership Level
          </span>
          <Badge className={`${colors.bg} ${colors.primary} border-0 text-sm px-3 py-1`}>
            {membershipLevel}
          </Badge>
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="text-sm space-y-2">
        {discountPercent > 0 && (
          <InfoCustomer
            label="Discount Benefit"
            value={`${discountPercent}% (Max ${formatedCurrency(membershipLevelData?.discount_max_amount || 0)})`}
          />
        )}
        {hasDiscount ? (
          <InfoCustomer
            label="Discount Applied"
            value={formatedCurrency(membershipDiscount)}
            valueClassName="text-green-600 font-semibold"
          />
        ) : (
          <p className="text-gray-500 text-xs">
            {discountPercent > 0
              ? "Add services to see discount applied"
              : "No discount benefit for this level"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
