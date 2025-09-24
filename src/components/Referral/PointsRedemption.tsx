"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCustomerStore } from "@/stores/customerStore";
import { useCartStore } from "@/stores/cartStore";
import { useReferralStore } from "@/stores/referralStore";
import { Coins, AlertCircle } from "lucide-react";
import { formatedCurrency } from "@/lib/utils";

export function PointsRedemption() {
  const { activeCustomer } = useCustomerStore();
  const { pointsUsed, setPointsUsed, totalPrice, subTotal } = useCartStore();
  const { getCustomerPointsBalance, pointToRupiahConversionRate } = useReferralStore();

  const [availablePoints, setAvailablePoints] = useState(0);
  const [pointsValue, setPointsValue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Only show for existing customers
  if (!activeCustomer || activeCustomer.isNew) {
    return null;
  }

  useEffect(() => {
    const fetchPointsBalance = async () => {
      setIsLoading(true);
      try {
        const balance = await getCustomerPointsBalance(activeCustomer.customer_id);
        setAvailablePoints(balance);
      } catch (error) {
        // Error fetching points balance
      } finally {
        setIsLoading(false);
      }
    };

    fetchPointsBalance();
  }, [activeCustomer.customer_id, getCustomerPointsBalance]);

  useEffect(() => {
    setPointsValue(pointsUsed * pointToRupiahConversionRate);
  }, [pointsUsed, pointToRupiahConversionRate]);

  const handlePointsChange = (value: number) => {
    const maxPoints = Math.min(availablePoints, Math.floor(totalPrice / pointToRupiahConversionRate));
    const clampedValue = Math.max(0, Math.min(value, maxPoints));
    setPointsUsed(clampedValue);
  };

  const handleMaxPoints = () => {
    const maxPoints = Math.min(availablePoints, Math.floor(totalPrice / pointToRupiahConversionRate));
    setPointsUsed(maxPoints);
  };

  const handleClearPoints = () => {
    setPointsUsed(0);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Use Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Loading points balance...</div>
        </CardContent>
      </Card>
    );
  }

  if (availablePoints === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Use Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            No points available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Use Points
        </CardTitle>
        <CardDescription>
          Use your points to get a discount on this order
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Points Balance */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Available Points:</span>
          <Badge variant="secondary" className="text-sm">
            {availablePoints.toLocaleString('id-ID')} points
          </Badge>
        </div>

        {/* Points Value */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Points Value:</span>
          <span className="text-sm text-muted-foreground">
            1 point = Rp {pointToRupiahConversionRate.toLocaleString('id-ID')}
          </span>
        </div>

        {/* Points Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Points to Use:</label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              max={Math.min(availablePoints, Math.floor(totalPrice / pointToRupiahConversionRate))}
              value={pointsUsed || ""}
              onChange={(e) => handlePointsChange(Number(e.target.value) || 0)}
              placeholder="Enter points"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMaxPoints}
              disabled={availablePoints === 0 || totalPrice === 0}
            >
              Max
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearPoints}
              disabled={pointsUsed === 0}
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Points Value Display */}
        {pointsUsed > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center justify-between text-green-800">
              <span className="font-medium">Points Discount:</span>
              <span className="font-bold">
                -{formatedCurrency(pointsValue)}
              </span>
            </div>
            <div className="text-sm text-green-600 mt-1">
              {pointsUsed.toLocaleString('id-ID')} points used
            </div>
          </div>
        )}

        {/* Warning if points exceed available */}
        {pointsUsed > availablePoints && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-2 text-orange-800">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                You only have {availablePoints.toLocaleString('id-ID')} points available.
              </div>
            </div>
          </div>
        )}

        {/* Warning if points discount exceeds total price */}
        {pointsValue > totalPrice && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-2 text-orange-800">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                Points discount cannot exceed the total order amount.
              </div>
            </div>
          </div>
        )}

        {/* Remaining Points Info */}
        {pointsUsed > 0 && (
          <div className="text-xs text-muted-foreground">
            After redemption: {(availablePoints - pointsUsed).toLocaleString('id-ID')} points remaining
          </div>
        )}
      </CardContent>
    </Card>
  );
}