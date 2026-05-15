"use client";

import { useState, useEffect, useCallback } from "react";
import { useCustomerStore } from "@/stores/customerStore";
import { useCartStore } from "@/stores/cartStore";
import { usePointsRefreshStore } from "@/hooks/use-points-refresh";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Flame, CheckCircle, AlertCircle, Info } from "lucide-react";
import { formatedCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { ShinePointsService, AdminReferralService } from "@/lib/client-services";
import { logger } from "@/utils/client/logger";

interface ShinePointsRedemptionResult {
  valid: boolean;
  discount_amount?: number;
  points_used?: number;
  new_balance?: number;
  error?: string;
}

interface ReferralSettings {
  shine_points_redemption_minimum: number;
  shine_points_redemption_value: number;
}

export function ShinePointsRedemption() {
  const [pointsToRedeem, setPointsToRedeem] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [shinePoints, setShinePoints] = useState<number>(0);
  const [redemptionResult, setRedemptionResult] = useState<ShinePointsRedemptionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [referralSettings, setReferralSettings] = useState<ReferralSettings>({
    shine_points_redemption_minimum: 50,
    shine_points_redemption_value: 1000
  });

  const activeCustomer = useCustomerStore((state) => state.activeCustomer);
  const refreshTrigger = usePointsRefreshStore((state) => state.timestamp);
  const {
    shinePointsDiscount,
    setShinePointsUsed,
    setShinePointsDiscount,
    clearShinePointsDiscount,
    membershipLevel,
    membershipLevelData
  } = useCartStore();

  const fetchReferralSettings = useCallback(async () => {
    try {
      const settings = await AdminReferralService.getReferralSettings();
      setReferralSettings({
        shine_points_redemption_minimum: settings.shine_points_redemption_minimum || 50,
        shine_points_redemption_value: settings.shine_points_redemption_value || 1000
      });
    } catch (error) {
      logger.error("Error fetching referral settings", { error }, "ShinePointsRedemption");
      // Keep default values on error
    }
  }, []);

  const fetchCustomerShinePoints = useCallback(async () => {
    if (!activeCustomer) return;

    setLoading(true);
    try {
      const points = await ShinePointsService.getCustomerShinePoints(activeCustomer.customer_id);
      setShinePoints(points);
    } catch (error) {
      logger.error("Error fetching customer shine points", { error, customerId: activeCustomer?.customer_id }, "ShinePointsRedemption");
      setShinePoints(0);
    } finally {
      setLoading(false);
    }
  }, [activeCustomer]);

  useEffect(() => {
    // Fetch referral settings once on mount
    fetchReferralSettings();

    if (activeCustomer) {
      fetchCustomerShinePoints();
    }
  }, [activeCustomer, fetchCustomerShinePoints, fetchReferralSettings, refreshTrigger]);

  const validatePointsRedemption = async () => {
    if (!pointsToRedeem || !activeCustomer) {
      toast.error("Please enter points to redeem");
      return;
    }

    const points = parseInt(pointsToRedeem);
    if (isNaN(points) || points <= 0) {
      toast.error("Please enter a valid number of points");
      return;
    }

    setIsValidating(true);
    try {
      const result = await ShinePointsService.validateShinePointsRedemption(activeCustomer.customer_id, points);

      if (result.valid) {
        setRedemptionResult(result);
        setShinePointsUsed(points);
        setShinePointsDiscount(result.discount_amount || 0);
        toast.success(
          `Shine Points redeemed! You saved ${formatedCurrency(result.discount_amount || 0)}`
        );
      } else {
        setRedemptionResult(result);
        toast.error(result.error || "Cannot redeem shine points");
      }
    } catch (error) {
      logger.error("Error redeeming shine points", { error, pointsToRedeem, customerId: activeCustomer?.customer_id }, "ShinePointsRedemption");
      toast.error("Failed to redeem shine points");
    } finally {
      setIsValidating(false);
    }
  };

  const clearPointsRedemption = () => {
    setPointsToRedeem("");
    setRedemptionResult(null);
    clearShinePointsDiscount();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      validatePointsRedemption();
    }
  };

  const redeemMaximumPoints = () => {
    if (shinePoints > 0) {
      setPointsToRedeem(shinePoints.toString());
    }
  };

  // If points are already applied, show applied state
  if (shinePointsDiscount > 0 && redemptionResult?.valid) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-purple-600" />
            Shine Points Redemption
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-md border border-purple-200 bg-purple-50 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-purple-600" />
              <div>
                <p className="font-semibold text-purple-800">
                  Shine Points Applied
                </p>
                <p className="text-sm text-purple-600">
                  {redemptionResult.points_used} shine points redeemed
                </p>
                <p className="text-sm text-purple-600">
                  Discount: {formatedCurrency(shinePointsDiscount)}
                </p>
                <p className="text-xs text-purple-500">
                  Remaining balance: {redemptionResult.new_balance} shine points
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={clearPointsRedemption}
            >
              ×
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-purple-600" />
            Shine Points Redemption
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (shinePoints === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-purple-600" />
            Shine Points Redemption
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You don&apos;t have any Shine Points available. Earn points by completing orders and leveling up your membership!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-purple-600" />
          Shine Points Redemption
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Shine Points Balance */}
        <div className="rounded-md border border-purple-200 bg-purple-50 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Available Shine Points</p>
              <p className="text-2xl font-bold text-purple-900">
                {shinePoints}
              </p>
              <p className="text-xs text-purple-600">
                Membership Level: {membershipLevel || "Bronze"}
              </p>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              {formatedCurrency(Math.floor(shinePoints * referralSettings.shine_points_redemption_value))}*
            </Badge>
          </div>
          <p className="text-xs text-purple-600 mt-2">
            *Estimated value (1 shine point = Rp {referralSettings.shine_points_redemption_value})
          </p>
        </div>

        {/* Shine Points Redemption Input */}
        <div className="space-y-2">
          <Label htmlFor="shinePointsToRedeem">Redeem Shine Points (Minimum {referralSettings.shine_points_redemption_minimum})</Label>
          <div className="flex gap-2">
            <Input
              id="shinePointsToRedeem"
              type="number"
              placeholder="Enter points to redeem..."
              value={pointsToRedeem}
              onChange={(e) => setPointsToRedeem(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isValidating}
              min={referralSettings.shine_points_redemption_minimum}
              max={shinePoints}
            />
            <Button
              variant="outline"
              onClick={redeemMaximumPoints}
              disabled={isValidating}
            >
              Max
            </Button>
            <Button
              onClick={validatePointsRedemption}
              disabled={!pointsToRedeem || isValidating}
            >
              {isValidating ? "Validating..." : "Redeem"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            You have {shinePoints} shine points available
          </p>
        </div>

        {/* Redemption Result */}
        {redemptionResult && (
          <div className={`rounded-md border p-3 ${
            redemptionResult.valid
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }`}>
            <div className="flex items-start gap-2">
              {redemptionResult.valid ? (
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                {redemptionResult.valid ? (
                  <>
                    <p className="font-semibold text-green-800">
                      Shine Points Ready to Redeem!
                    </p>
                    <p className="text-sm text-green-600">
                      {redemptionResult.points_used} shine points → {formatedCurrency(redemptionResult.discount_amount || 0)} discount
                    </p>
                    <p className="text-xs text-green-500">
                      New balance will be: {redemptionResult.new_balance} shine points
                    </p>
                    <p className="text-xs text-green-500 mt-2">
                      This will be applied when you complete your order
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-red-800">
                      Cannot Redeem Shine Points
                    </p>
                    <p className="text-sm text-red-600">
                      {redemptionResult.error || "Unable to redeem shine points"}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info about shine points system */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Shine Points are earned through membership activities and can be redeemed for discounts on orders.
            Minimum {referralSettings.shine_points_redemption_minimum} shine points required for redemption.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
