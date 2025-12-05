"use client";

import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  MapPin
} from "lucide-react";
import { useAdminDropPointCustomerStore } from "@/stores/adminDropPointCustomerStore";
import { formatedCurrency } from "@/lib/utils";

export function CustomerAnalytics() {
  const { analytics, loading, fetchAnalytics } = useAdminDropPointCustomerStore();

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading || !analytics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const analyticsCards = [
    {
      title: "Total Customers",
      value: analytics.total_customers.toLocaleString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Customers",
      value: analytics.active_customers.toLocaleString(),
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Orders",
      value: analytics.total_orders.toLocaleString(),
      icon: ShoppingCart,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Revenue",
      value: formatedCurrency(analytics.total_revenue),
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Main Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {analyticsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <div className={`p-2 rounded-full ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Segments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customer Segments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">New Customers</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {analytics.customer_segments.new_customers}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Regular Customers</span>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                {analytics.customer_segments.regular_customers}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Loyal Customers</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {analytics.customer_segments.loyal_customers}
              </Badge>
            </div>
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground">
                Based on last order date
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Orders/Customer</span>
              <span className="font-semibold">
                {analytics.average_orders_per_customer.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Items</span>
              <span className="font-semibold">
                {analytics.total_items.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Order Value</span>
              <span className="font-semibold">
                {formatedCurrency(analytics.average_items_per_order)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Top Drop-Points */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Top Drop-Points
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.top_drop_points.map((dropPoint, index) => (
              <div key={dropPoint.drop_point_id} className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate max-w-[150px]">
                    {dropPoint.drop_point_name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {dropPoint.total_orders} orders
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    {dropPoint.customer_count}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    customers
                  </div>
                </div>
              </div>
            ))}
            {analytics.top_drop_points.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                No drop-point data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}