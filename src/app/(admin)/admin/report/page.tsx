"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, TrendingUp, ShoppingCart, DollarSign, Filter, BarChart3, Calendar as CalendarIcon2 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Area, AreaChart } from "recharts";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useSalesReportStore } from "@/stores/salesReportStore";
import { toast } from "sonner";
import { Headers } from "@/components/MainComponent/Header";
import { Skeleton } from "@/components/ui/skeleton";
import { ContributionGraph } from "@/components/Dashboard/ContributionGraph";

type DateRangePreset = "7days" | "1month" | "3months" | "custom";

const chartConfig = {
  total: {
    label: "Revenue",
    color: "hsl(221, 83%, 53%)",
  },
};

export default function ReportPage() {
  const [preset, setPreset] = useState<DateRangePreset>("7days");
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: "",
    endDate: "",
  });

  const { data, isLoading, fetchSalesReport } = useSalesReportStore();

  // Apply preset date ranges
  const applyPreset = useCallback((presetValue: DateRangePreset) => {
    const now = new Date();
    const startDate = new Date();

    switch (presetValue) {
      case "7days":
        startDate.setDate(now.getDate() - 7);
        break;
      case "1month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "3months":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "custom":
        // Don't change date range for custom, user will select via calendar
        return;
    }

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = now.toISOString().split("T")[0];

    setDateRange({ startDate: startDateStr, endDate: endDateStr });
  }, []);

  // Handle custom date range selection
  useEffect(() => {
    if (preset === "custom" && customDateRange.from && customDateRange.to) {
      const startDateStr = customDateRange.from.toISOString().split("T")[0];
      const endDateStr = customDateRange.to.toISOString().split("T")[0];
      setDateRange({ startDate: startDateStr, endDate: endDateStr });
    }
  }, [preset, customDateRange]);

  // Fetch data when date range changes
  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchSalesReport(dateRange.startDate, dateRange.endDate).catch((error) => {
        toast.error(`Failed to fetch sales report: ${(error as Error).message}`);
      });
    }
  }, [dateRange]);

  // Initialize with 7 days preset
  useEffect(() => {
    applyPreset("7days");
  }, [applyPreset]);

  const handlePresetChange = (newPreset: DateRangePreset) => {
    setPreset(newPreset);
    if (newPreset !== "custom") {
      applyPreset(newPreset);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM dd");
  };

  const chartData = data?.dailySales.map((item) => ({
    date: formatDate(item.date),
    total: item.total,
  })) || [];

  return (
    <div className="w-full min-h-screen px-6 py-6 bg-slate-50/50 dark:bg-slate-950">
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <Headers
          title="Sales Report"
          desc="View and analyze your sales performance over time"
        />

        {/* Date Filter Section */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-5 w-5 text-muted-foreground" />
              Date Filter
            </CardTitle>
            <CardDescription className="text-sm">
              Select a time period to view sales data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={preset === "7days" ? "default" : "outline"}
                onClick={() => handlePresetChange("7days")}
                size="sm"
              >
                Last 7 Days
              </Button>
              <Button
                variant={preset === "1month" ? "default" : "outline"}
                onClick={() => handlePresetChange("1month")}
                size="sm"
              >
                Last Month
              </Button>
              <Button
                variant={preset === "3months" ? "default" : "outline"}
                onClick={() => handlePresetChange("3months")}
                size="sm"
              >
                Last 3 Months
              </Button>

              {/* Custom Date Range Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={preset === "custom" ? "default" : "outline"}
                    className="justify-start text-left font-normal"
                    size="sm"
                    onClick={() => setPreset("custom")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDateRange.from ? (
                      customDateRange.to ? (
                        <>
                          {format(customDateRange.from, "LLL dd, y")} -{" "}
                          {format(customDateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(customDateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Custom Range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={customDateRange.from}
                    selected={{
                      from: customDateRange.from,
                      to: customDateRange.to,
                    }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setCustomDateRange({ from: range.from, to: range.to });
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Display Current Range */}
            {dateRange.startDate && dateRange.endDate && (
              <div className="mt-4 flex items-center gap-2 text-sm">
                <CalendarIcon2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Showing data from{" "}
                  <span className="font-medium text-foreground">
                    {formatDate(dateRange.startDate)}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-foreground">
                    {formatDate(dateRange.endDate)}
                  </span>
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Total Revenue Card */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {data ? formatCurrency(data.totalRevenue) : "-"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total sales in selected period
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Total Orders Card */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {data?.totalOrders ?? "-"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Orders in selected period
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Average Order Value Card */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {data ? formatCurrency(data.averageOrderValue) : "-"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Average revenue per order
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sales Chart */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              Daily Sales Trend
            </CardTitle>
            <CardDescription className="text-sm">
              Revenue generated per day in the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[300px] w-full flex items-center justify-center">
                <Skeleton className="h-full w-full rounded-lg" />
              </div>
            ) : chartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={12}
                      minTickGap={32}
                      className="text-xs"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={12}
                      tickFormatter={(value) => formatCurrency(value)}
                      className="text-xs"
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                      formatter={(value) => formatCurrency(value as number)}
                    />
                    <Area
                      dataKey="total"
                      type="monotone"
                      stroke="hsl(221, 83%, 53%)"
                      strokeWidth={2}
                      fill="url(#colorTotal)"
                      dot={{ r: 4, fill: "hsl(221, 83%, 53%)" }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] w-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">No sales data available</p>
                  <p className="text-xs">Try selecting a different date range</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contribution Graph */}
        {!isLoading && data && data.dailySales.length > 0 && (
          <ContributionGraph data={data.dailySales} />
        )}
      </div>
    </div>
  );
}
