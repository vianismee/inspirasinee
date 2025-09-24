"use client";

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReferralStore } from "@/stores/referralStore";
import { useCustomerStore } from "@/stores/customerStore";
import { useOrderStore } from "@/stores/orderStore";
import {
  Users,
  Gift,
  TrendingUp,
  TrendingDown,
  Target,
  Star,
  Award,
  Activity,
} from "lucide-react";
import { formatedCurrency } from "@/lib/utils";

export function ReferralStats() {
  const { customerPointsSummary, pointTransactions } = useReferralStore();
  const { customers } = useCustomerStore();
  const { orders } = useOrderStore();

  // Calculate statistics
  const stats = useMemo(() => {
    // Total customers with points
    const customersWithPoints = customerPointsSummary.length;
    const totalCustomers = customers.length;
    const participationRate = totalCustomers > 0 ? (customersWithPoints / totalCustomers) * 100 : 0;

    // Points statistics
    const totalPointsInCirculation = customerPointsSummary.reduce((sum, customer) => sum + customer.points_balance, 0);
    const totalPointsEarned = pointTransactions
      .filter(t => t.transaction_type === 'credit')
      .reduce((sum, t) => sum + t.points, 0);
    const totalPointsSpent = pointTransactions
      .filter(t => t.transaction_type === 'debit')
      .reduce((sum, t) => sum + t.points, 0);

    // Referral statistics
    const referralOrders = orders.filter(order => order.referral_code_used);
    const totalReferralDiscount = referralOrders.reduce((sum, order) => sum + (order.referral_discount_amount || 0), 0);
    const totalPointsDiscount = orders.reduce((sum, order) => sum + (order.points_discount_amount || 0), 0);

    // Customer tiers
    const highValueCustomers = customerPointsSummary.filter(c => c.points_balance > 500).length;
    const activeCustomers = customerPointsSummary.filter(c => c.points_balance > 0).length;

    // Recent activity
    const recentTransactions = pointTransactions.filter(t => {
      const transactionDate = new Date(t.created_at!);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return transactionDate >= sevenDaysAgo;
    });

    const recentCredits = recentTransactions
      .filter(t => t.transaction_type === 'credit')
      .reduce((sum, t) => sum + t.points, 0);

    const recentDebits = recentTransactions
      .filter(t => t.transaction_type === 'debit')
      .reduce((sum, t) => sum + t.points, 0);

    return {
      customersWithPoints,
      totalCustomers,
      participationRate,
      totalPointsInCirculation,
      totalPointsEarned,
      totalPointsSpent,
      referralOrders: referralOrders.length,
      totalReferralDiscount,
      totalPointsDiscount,
      highValueCustomers,
      activeCustomers,
      recentActivity: recentTransactions.length,
      recentCredits,
      recentDebits,
    };
  }, [customerPointsSummary, pointTransactions, customers, orders]);

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Customer Engagement */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Customer Engagement</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold">{stats.participationRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.customersWithPoints} of {stats.totalCustomers} customers have points
          </p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Active:</span>
              <Badge variant="secondary">{stats.activeCustomers}</Badge>
            </div>
            <div className="flex justify-between">
              <span>High Value:</span>
              <Badge variant="outline">{stats.highValueCustomers}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Points Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Points Overview</CardTitle>
          <Gift className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold">{stats.totalPointsInCirculation.toLocaleString('id-ID')}</div>
          <p className="text-xs text-muted-foreground">Total points in circulation</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-green-600">Earned:</span>
              <span className="font-medium">+{stats.totalPointsEarned.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600">Spent:</span>
              <span className="font-medium">-{stats.totalPointsSpent.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Performance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Referral Performance</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold">{stats.referralOrders}</div>
          <p className="text-xs text-muted-foreground">Successful referrals</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Discount Given:</span>
              <span className="font-medium">{formatedCurrency(stats.totalReferralDiscount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Points Used:</span>
              <span className="font-medium">{formatedCurrency(stats.totalPointsDiscount)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Activity (7 days)</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold">{stats.recentActivity}</div>
          <p className="text-xs text-muted-foreground">Point transactions</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-green-600">Credits:</span>
              <span className="font-medium">+{stats.recentCredits.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600">Debits:</span>
              <span className="font-medium">-{stats.recentDebits.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Average Points */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Balance</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold">
            {stats.activeCustomers > 0
              ? Math.round(stats.totalPointsInCirculation / stats.activeCustomers).toLocaleString('id-ID')
              : 0
            }
          </div>
          <p className="text-xs text-muted-foreground">Points per active customer</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>All Customers:</span>
              <span>{stats.totalCustomers > 0 ? Math.round(stats.totalPointsInCirculation / stats.totalCustomers) : 0}</span>
            </div>
            <div className="flex justify-between">
              <span>Point Value:</span>
              <span>Rp 100/pt</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Program Health */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Program Health</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold">
            {stats.totalPointsEarned > 0
              ? ((stats.totalPointsSpent / stats.totalPointsEarned) * 100).toFixed(1)
              : 0
            }%
          </div>
          <p className="text-xs text-muted-foreground">Points redemption rate</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Referral ROI:</span>
              <span>{stats.totalReferralDiscount > 0 ? ((stats.totalPointsEarned * 100) / stats.totalReferralDiscount).toFixed(1) : 0}x</span>
            </div>
            <div className="flex justify-between">
              <span>Active Rate:</span>
              <span>{stats.totalCustomers > 0 ? ((stats.activeCustomers / stats.totalCustomers) * 100).toFixed(1) : 0}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}