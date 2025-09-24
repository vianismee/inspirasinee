"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReferralStore } from "@/stores/referralStore";
import { ReferralSettings } from "@/components/Referral/ReferralSettings";
import { CustomerPointsTable } from "@/components/Referral/CustomerPointsTable";
import { PointTransactionsTable } from "@/components/Referral/PointTransactionsTable";
import { ReferralStats } from "@/components/Referral/ReferralStats";
import { Users, Gift, Settings, TrendingUp } from "lucide-react";

export default function ReferralPage() {
  const {
    customerPointsSummary,
    pointTransactions,
    settings,
    loading,
    refreshData,
  } = useReferralStore();

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Referral Management</h1>
          <p className="text-muted-foreground">
            Manage referral program settings and track customer points
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerPointsSummary.length}</div>
            <p className="text-xs text-muted-foreground">
              with points balance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customerPointsSummary.reduce((sum, customer) => sum + customer.points_balance, 0).toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground">
              points in circulation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pointTransactions.length}</div>
            <p className="text-xs text-muted-foreground">
              point transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Settings</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settings.length}</div>
            <p className="text-xs text-muted-foreground">
              referral settings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customers">Customer Points</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ReferralStats />
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <CustomerPointsTable />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <PointTransactionsTable />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <ReferralSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}