"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Headers } from "@/components/MainComponent/Header";
import { ReferralNavigation } from "@/components/referral-nav";
import { Settings, Users, TrendingUp, Gift } from "lucide-react";
import { toast } from "sonner";
import { AdminReferralService } from "@/lib/client-services";


interface AnalyticsData {
  summary: {
    totalReferrals: number;
    totalReferralDiscount: number;
    totalPointsAwarded: number;
    totalPointsRedeemed: number;
    activeCustomersWithPoints: number;
    totalCustomersWithPoints: number;
  };
  topReferrers: Array<{
    referrer_customer_id: string;
    referrer_name: string;
    referralCount: number;
    totalPointsEarned: number;
  }>;
}

export default function ReferralManagementPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    referral_discount_amount: 0,
    referrer_points_earned: 0,
    points_redemption_minimum: 50,
    points_redemption_value: 0,
    is_active: true
  });

  useEffect(() => {
    fetchSettings();
    fetchAnalytics();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await AdminReferralService.getReferralSettings();
      setFormData({
        referral_discount_amount: data.referral_discount_amount,
        referrer_points_earned: data.referrer_points_earned,
        points_redemption_minimum: data.points_redemption_minimum,
        points_redemption_value: data.points_redemption_value,
        is_active: data.is_active
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to fetch referral settings");
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await AdminReferralService.getReferralAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const result = await AdminReferralService.updateReferralSettings(formData);
      if (result) {
        toast.success("Referral settings updated successfully");
      } else {
        toast.error("Failed to update settings");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update referral settings");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="w-full h-screen px-[30px] py-[30px]">
        <div className="flex flex-col gap-4">
          <Headers
            title="Referral Management"
            desc="Manage referral system settings and analytics"
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen px-[30px] py-[30px]">
      <div className="flex flex-col gap-6">
        <Headers
          title="Referral Management"
          desc="Manage referral system settings and analytics"
        />

        <ReferralNavigation />

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.summary.totalReferrals}</div>
                <p className="text-xs text-muted-foreground">
                  Customers referred
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Referral Discounts</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  Rp {(analytics.summary.totalReferralDiscount).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total discount given
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Points Awarded</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.summary.totalPointsAwarded}</div>
                <p className="text-xs text-muted-foreground">
                  Points earned by referrers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Points Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.summary.activeCustomersWithPoints}</div>
                <p className="text-xs text-muted-foreground">
                  Customers with points
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Settings Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Referral Settings
            </CardTitle>
            <CardDescription>
              Configure the referral system parameters and point redemption rules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>System Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable the referral system
                  </p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                />
              </div>

              <Separator />

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="referral_discount_amount">
                    Referral Discount Amount (Rp)
                  </Label>
                  <Input
                    id="referral_discount_amount"
                    type="number"
                    value={formData.referral_discount_amount}
                    onChange={(e) => handleInputChange("referral_discount_amount", parseInt(e.target.value) || 0)}
                    placeholder="10000"
                  />
                  <p className="text-sm text-muted-foreground">
                    Discount amount for new users using referral code
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referrer_points_earned">
                    Points for Referrer
                  </Label>
                  <Input
                    id="referrer_points_earned"
                    type="number"
                    value={formData.referrer_points_earned}
                    onChange={(e) => handleInputChange("referrer_points_earned", parseInt(e.target.value) || 0)}
                    placeholder="50"
                  />
                  <p className="text-sm text-muted-foreground">
                    Points awarded to the referrer for each successful referral
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="points_redemption_minimum">
                    Minimum Points to Redeem
                  </Label>
                  <Input
                    id="points_redemption_minimum"
                    type="number"
                    value={formData.points_redemption_minimum}
                    onChange={(e) => handleInputChange("points_redemption_minimum", parseInt(e.target.value) || 0)}
                    placeholder="50"
                  />
                  <p className="text-sm text-muted-foreground">
                    Minimum points required for redemption
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="points_redemption_value">
                    Point Redemption Value (Rp)
                  </Label>
                  <Input
                    id="points_redemption_value"
                    type="number"
                    value={formData.points_redemption_value}
                    onChange={(e) => handleInputChange("points_redemption_value", parseInt(e.target.value) || 0)}
                    placeholder="500"
                  />
                  <p className="text-sm text-muted-foreground">
                    Discount amount per point redeemed
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Top Referrers */}
        {analytics?.topReferrers && analytics.topReferrers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Referrers</CardTitle>
              <CardDescription>
                Customers with the most successful referrals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topReferrers.slice(0, 5).map((referrer, index) => (
                  <div key={referrer.referrer_customer_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{referrer.referrer_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {referrer.referrer_customer_id}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{referrer.referralCount} referrals</p>
                      <p className="text-sm text-muted-foreground">
                        {referrer.totalPointsEarned} points earned
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}