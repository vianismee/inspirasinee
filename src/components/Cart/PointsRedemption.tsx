"use client";

import { useState, useEffect, useCallback } from "react";
import { useCustomerStore } from "@/stores/customerStore";
import { useCartStore } from "@/stores/cartStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Gift, CheckCircle, AlertCircle, Info } from "lucide-react";
import { formatedCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { PointsService, AdminReferralService } from "@/lib/client-services";

interface CustomerPoints {
  current_balance: number;
  total_earned: number;
  total_redeemed: number;
}

interface PointsRedemptionResult {
  valid: boolean;
  discount_amount?: number;
  points_used?: number;
  new_balance?: number;
  error?: string;
}

interface ReferralSettings {
  points_redemption_minimum: number;
  points_redemption_value: number;
}

export function PointsRedemption() {
  const [pointsToRedeem, setPointsToRedeem] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [customerPoints, setCustomerPoints] = useState<CustomerPoints | null>(null);
  const [redemptionResult, setRedemptionResult] = useState<PointsRedemptionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [referralSettings, setReferralSettings] = useState<ReferralSettings>({
    points_redemption_minimum: 50,
    points_redemption_value: 100
  });

  const activeCustomer = useCustomerStore((state) => state.activeCustomer);
  const {
    pointsDiscount,
    setPointsUsed,
    setPointsDiscount,
    clearPointsDiscount,
    pointsUsed: appliedPoints
  } = useCartStore();

  const fetchReferralSettings = useCallback(async () => {
    try {
      const settings = await AdminReferralService.getReferralSettings();
      setReferralSettings({
        points_redemption_minimum: settings.points_redemption_minimum || 50,
        points_redemption_value: settings.points_redemption_value || 100
      });
    } catch (error) {
      console.error("Error fetching referral settings:", error);
      // Keep default values on error
    }
  }, []);

  const fetchCustomerPoints = useCallback(async () => {
    if (!activeCustomer) return;

    setLoading(true);
    try {
      const points = await PointsService.getCustomerBalance(activeCustomer.customer_id);
      setCustomerPoints(points);
    } catch (error) {
      console.error("Error fetching customer points:", error);
      // Set default points on error to avoid breaking the UI
      setCustomerPoints({
        current_balance: 0,
        total_earned: 0,
        total_redeemed: 0
      });
    } finally {
      setLoading(false);
    }
  }, [activeCustomer]);

  useEffect(() => {
    // Fetch referral settings once on mount
    fetchReferralSettings();

    if (activeCustomer) {
      fetchCustomerPoints();
    }
  }, [activeCustomer, fetchCustomerPoints, fetchReferralSettings]);

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
      const result = await PointsService.validatePointsRedemption(activeCustomer.customer_id, points);

      if (result.valid) {
        setRedemptionResult(result);
        setPointsUsed(result.points_used || 0);
        setPointsDiscount(result.discount_amount || 0);
        toast.success(
          `Points redeemed! You saved ${formatedCurrency(result.discount_amount || 0)}`
        );
      } else {
        setRedemptionResult(result);
        toast.error(result.error || "Cannot redeem points");
      }
    } catch (error) {
      console.error("Error redeeming points:", error);
      toast.error("Failed to redeem points");
    } finally {
      setIsValidating(false);
    }
  };

  const clearPointsRedemption = () => {
    setPointsToRedeem("");
    setRedemptionResult(null);
    clearPointsDiscount();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      validatePointsRedemption();
    }
  };

  const redeemMaximumPoints = () => {
    if (customerPoints && customerPoints.current_balance > 0) {
      setPointsToRedeem(customerPoints.current_balance.toString());
    }
  };

  // If points are already applied, show applied state
  if (appliedPoints > 0 && pointsDiscount > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Points Redemption
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <div>
                <p className="font-semibold text-blue-800">
                  Points Applied
                </p>
                <p className="text-sm text-blue-600">
                  {appliedPoints} points redeemed
                </p>
                <p className="text-sm text-blue-600">
                  Discount: {formatedCurrency(pointsDiscount)}
                </p>
                {customerPoints && (
                  <p className="text-xs text-blue-500">
                    Remaining balance: {customerPoints.current_balance - appliedPoints} points
                  </p>
                )}
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
            <Gift className="h-5 w-5" />
            Points Redemption
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

  if (!customerPoints || customerPoints.current_balance === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Points Redemption
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You don&apos;t have any points available for redemption. Earn points by referring friends!
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
          <Gift className="h-5 w-5" />
          Points Redemption
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Points Balance */}
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Available Points</p>
              <p className="text-2xl font-bold text-blue-900">
                {customerPoints.current_balance}
              </p>
              <p className="text-xs text-blue-600">
                Total earned: {customerPoints.total_earned} |
                Total redeemed: {customerPoints.total_redeemed}
              </p>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {formatedCurrency(Math.floor(customerPoints.current_balance * referralSettings.points_redemption_value))}*
            </Badge>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            *Estimated value ({referralSettings.points_redemption_value} points = Rp {referralSettings.points_redemption_value})
          </p>
        </div>

        {/* Points Redemption Input */}
        <div className="space-y-2">
          <Label htmlFor="pointsToRedeem">Redeem Points (Minimum {referralSettings.points_redemption_minimum})</Label>
          <div className="flex gap-2">
            <Input
              id="pointsToRedeem"
              type="number"
              placeholder="Enter points to redeem..."
              value={pointsToRedeem}
              onChange={(e) => setPointsToRedeem(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isValidating}
              min={referralSettings.points_redemption_minimum}
              max={customerPoints.current_balance}
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
            You have {customerPoints.current_balance} points available
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
                      Points Ready to Redeem!
                    </p>
                    <p className="text-sm text-green-600">
                      {redemptionResult.points_used} points → {formatedCurrency(redemptionResult.discount_amount || 0)} discount
                    </p>
                    <p className="text-xs text-green-500">
                      New balance will be: {redemptionResult.new_balance} points
                    </p>
                    <p className="text-xs text-green-500 mt-2">
                      This will be applied when you complete your order
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-red-800">
                      Cannot Redeem Points
                    </p>
                    <p className="text-sm text-red-600">
                      {redemptionResult.error || "Unable to redeem points"}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info about points system */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Points are earned through referrals and can be redeemed for discounts on future orders.
            Minimum {referralSettings.points_redemption_minimum} points required for redemption.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}