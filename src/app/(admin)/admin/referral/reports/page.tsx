"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Headers } from "@/components/MainComponent/Header";
import { Download, Filter, TrendingUp, Users, Gift, Target } from "lucide-react";
import { toast } from "sonner";

interface ReferralUsage {
  id: number;
  referral_code: string;
  referrer_customer_id: string;
  referred_customer_id: string;
  order_invoice_id: string;
  discount_applied: number;
  points_awarded: number;
  used_at: string;
  referrer: {
    username: string;
    email: string;
  };
  referred: {
    username: string;
    email: string;
  };
}

interface PointsTransaction {
  id: number;
  customer_id: string;
  transaction_type: 'earned' | 'redeemed' | 'adjusted';
  points_change: number;
  balance_after: number;
  reference_type: 'referral' | 'redemption' | 'manual_adjustment';
  reference_id?: string;
  description?: string;
  created_at: string;
  customer: {
    username: string;
    email: string;
  };
}

interface AnalyticsData {
  summary: {
    totalReferrals: number;
    totalReferralDiscount: number;
    totalPointsAwarded: number;
    totalPointsRedeemed: number;
    activeCustomersWithPoints: number;
    totalCustomersWithPoints: number;
  };
  recentReferrals: ReferralUsage[];
  recentTransactions: PointsTransaction[];
}

export default function ReferralReportsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: ""
  });
  const [transactionFilter, setTransactionFilter] = useState<string>("all");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFilter.startDate) params.append("startDate", dateFilter.startDate);
      if (dateFilter.endDate) params.append("endDate", dateFilter.endDate);

      const response = await fetch(`/api/admin/referral/analytics?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        toast.error("Failed to fetch analytics");
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  }, [dateFilter]);

  useEffect(() => {
    fetchAnalytics();
  }, [dateFilter, transactionFilter, fetchAnalytics]);

  const exportToCSV = (data: ReferralUsage[] | PointsTransaction[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = (row as unknown as Record<string, unknown>)[header];
        return typeof value === 'string' && value.includes(',')
          ? `"${value}"`
          : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filterTransactions = (transactions: PointsTransaction[]) => {
    if (transactionFilter === "all") return transactions;
    return transactions.filter(t => t.transaction_type === transactionFilter);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID');
  };

  if (loading) {
    return (
      <div className="w-full h-screen px-[30px] py-[30px]">
        <div className="flex flex-col gap-4">
          <Headers
            title="Referral Reports"
            desc="Detailed referral tracking and analytics"
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
          title="Referral Reports"
          desc="Detailed referral tracking and analytics"
        />

        {/* Date Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transactionFilter">Transaction Type</Label>
                <Select value={transactionFilter} onValueChange={setTransactionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Transactions</SelectItem>
                    <SelectItem value="earned">Points Earned</SelectItem>
                    <SelectItem value="redeemed">Points Redeemed</SelectItem>
                    <SelectItem value="adjusted">Manual Adjustments</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {analytics && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.summary.totalReferrals}</div>
                <p className="text-xs text-muted-foreground">
                  Successful referrals
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Referral Revenue Impact</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(analytics.summary.totalReferralDiscount)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total discounts given
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Points in Circulation</CardTitle>
                <Gift className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.summary.totalPointsAwarded - analytics.summary.totalPointsRedeemed}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active points balance
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Participants</CardTitle>
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

        {/* Recent Referrals */}
        {analytics?.recentReferrals && analytics.recentReferrals.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Referrals</CardTitle>
                  <CardDescription>
                    Latest successful referral conversions
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV(analytics.recentReferrals, 'referrals.csv')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>Referrer</TableHead>
                    <TableHead>New Customer</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Points Awarded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.recentReferrals.map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell>{formatDate(referral.used_at)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{referral.referral_code}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{referral.referrer.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {referral.referrer.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{referral.referred.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {referral.referred.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{referral.order_invoice_id}</TableCell>
                      <TableCell>{formatCurrency(referral.discount_applied)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{referral.points_awarded} pts</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Points Transactions */}
        {analytics?.recentTransactions && analytics.recentTransactions.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Points Transactions</CardTitle>
                  <CardDescription>
                    Recent points activity across all customers
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToCSV(filterTransactions(analytics.recentTransactions), 'transactions.csv')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Points Change</TableHead>
                    <TableHead>Balance After</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterTransactions(analytics.recentTransactions).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.created_at)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transaction.customer.username}</p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.customer.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          transaction.transaction_type === 'earned' ? 'default' :
                          transaction.transaction_type === 'redeemed' ? 'destructive' : 'secondary'
                        }>
                          {transaction.transaction_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={
                          transaction.points_change > 0 ? 'text-green-600' : 'text-red-600'
                        }>
                          {transaction.points_change > 0 ? '+' : ''}{transaction.points_change}
                        </span>
                      </TableCell>
                      <TableCell>{transaction.balance_after}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{transaction.reference_type}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {transaction.description || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}