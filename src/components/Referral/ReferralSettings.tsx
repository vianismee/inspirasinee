"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useReferralStore } from "@/stores/referralStore";
import { Settings, Save, RefreshCw } from "lucide-react";

export function ReferralSettings() {
  const {
    settings,
    newCustomerDiscountAmount,
    referrerPointsPerReferral,
    pointToRupiahConversionRate,
    updateSetting,
    settingsLoading,
    refreshData,
  } = useReferralStore();

  const [isEditing, setIsEditing] = useState(false);
  const [localSettings, setLocalSettings] = useState({
    newCustomerDiscountAmount,
    referrerPointsPerReferral,
    pointToRupiahConversionRate,
  });

  const handleEdit = () => {
    setLocalSettings({
      newCustomerDiscountAmount,
      referrerPointsPerReferral,
      pointToRupiahConversionRate,
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      const updates = [
        updateSetting('new_customer_discount_amount', localSettings.newCustomerDiscountAmount.toString()),
        updateSetting('referrer_points_per_referral', localSettings.referrerPointsPerReferral.toString()),
        updateSetting('point_to_rupiah_conversion_rate', localSettings.pointToRupiahConversionRate.toString()),
      ];

      const results = await Promise.all(updates);

      if (results.every(result => result)) {
        toast.success("Settings updated successfully!");
        setIsEditing(false);
        await refreshData();
      } else {
        toast.error("Some settings failed to update. Please try again.");
      }
    } catch (error) {
      // Error saving settings
      toast.error("Failed to save settings. Please try again.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Referral Settings
        </CardTitle>
        <CardDescription>
          Configure referral program parameters and point conversion rates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Settings Display/Edit */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount">New Customer Discount</Label>
              {isEditing ? (
                <Input
                  id="discount"
                  type="number"
                  value={localSettings.newCustomerDiscountAmount}
                  onChange={(e) => setLocalSettings(prev => ({
                    ...prev,
                    newCustomerDiscountAmount: Number(e.target.value) || 0
                  }))}
                  min="0"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    value={`Rp ${newCustomerDiscountAmount.toLocaleString('id-ID')}`}
                    readOnly
                    className="bg-muted"
                  />
                  <Badge variant="secondary">Per referral</Badge>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Referrer Points</Label>
              {isEditing ? (
                <Input
                  id="points"
                  type="number"
                  value={localSettings.referrerPointsPerReferral}
                  onChange={(e) => setLocalSettings(prev => ({
                    ...prev,
                    referrerPointsPerReferral: Number(e.target.value) || 0
                  }))}
                  min="0"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    value={`${referrerPointsPerReferral.toLocaleString('id-ID')} points`}
                    readOnly
                    className="bg-muted"
                  />
                  <Badge variant="secondary">Per successful referral</Badge>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="conversion">Point Conversion Rate</Label>
              {isEditing ? (
                <Input
                  id="conversion"
                  type="number"
                  value={localSettings.pointToRupiahConversionRate}
                  onChange={(e) => setLocalSettings(prev => ({
                    ...prev,
                    pointToRupiahConversionRate: Number(e.target.value) || 0
                  }))}
                  min="1"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    value={`Rp ${pointToRupiahConversionRate.toLocaleString('id-ID')}`}
                    readOnly
                    className="bg-muted"
                  />
                  <Badge variant="secondary">1 point</Badge>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave} disabled={settingsLoading}>
                  {settingsLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {settingsLoading ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={handleEdit}>
                <Settings className="h-4 w-4 mr-2" />
                Edit Settings
              </Button>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
          <h4 className="font-medium text-sm">How it works:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• New customers get Rp {newCustomerDiscountAmount.toLocaleString('id-ID')} discount when using a referral code</li>
            <li>• Referrers earn {referrerPointsPerReferral} points for each successful referral</li>
            <li>• Each point is worth Rp {pointToRupiahConversionRate.toLocaleString('id-ID')} in redemptions</li>
            <li>• Points can be used as discounts on future purchases</li>
          </ul>
        </div>

        {/* Raw Settings */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">All Settings:</h4>
          <div className="bg-muted p-3 rounded-lg font-mono text-xs space-y-1">
            {settings.map((setting) => (
              <div key={setting.setting_name} className="flex justify-between">
                <span className="text-muted-foreground">{setting.setting_name}:</span>
                <span>{setting.setting_value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}