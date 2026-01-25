"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Package,
  MapPin,
  Search,
  RefreshCw,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { AdminDropPointService } from "@/lib/client-services";
import { formatedCurrency } from "@/lib/utils";

interface DropPointOrder {
  id: number;
  invoice_id: string;
  customer_id: string;
  status: string;
  payment: string;
  total_price: number;
  created_at: string;
  customer_marking: string;
  drop_point_id: number;
  customers: {
    customer_id: string;
    username: string;
    whatsapp: string;
    email: string;
  } | null;
  drop_points: {
    id: number;
    name: string;
    address: string;
  } | null;
  order_item: Array<{
    id: number;
    shoe_name: string;
    color: string;
    size: string;
    item_number: number;
    has_white_treatment: boolean;
  }>;
}

interface DropPointStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  dropPoints: Array<{
    id: number;
    name: string;
    address: string;
    maxCapacity: number;
    currentCapacity: number;
    availableCapacity: number;
    occupancyPercentage: number;
  }>;
  capacitySummary: {
    total: number;
    used: number;
    available: number;
    percentage: number;
  };
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending" },
  { value: "pickup", label: "Pickup" },
  { value: "cleaning", label: "Cleaning" },
  { value: "finish", label: "Finish" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  pickup: "bg-orange-100 text-orange-800",
  cleaning: "bg-blue-100 text-blue-800",
  finish: "bg-green-100 text-green-800",
  // Legacy status colors for backwards compatibility
  processing: "bg-blue-100 text-blue-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  done: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export function DropPointDashboard() {
  const [orders, setOrders] = useState<DropPointOrder[]>([]);
  const [stats, setStats] = useState<DropPointStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dropPointFilter, setDropPointFilter] = useState("all");
  const [, setSelectedOrder] = useState<DropPointOrder | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [ordersResult, statsResult] = await Promise.all([
        AdminDropPointService.getDropPointOrders({
          status: statusFilter !== "all" ? statusFilter : undefined,
          drop_point_id: dropPointFilter !== "all" ? parseInt(dropPointFilter) : undefined,
          search: searchQuery || undefined,
          page: pagination.page,
          limit: pagination.limit,
        }),
        AdminDropPointService.getDropPointStats(),
      ]);

      setOrders(ordersResult.orders);
      setPagination(ordersResult.pagination);
      setStats(statsResult);
    } catch (error) {
      console.error("Failed to fetch drop-point data:", error);
      toast.error("Failed to load drop-point data");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, dropPointFilter, searchQuery, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
    toast.success("Data refreshed");
  };

  const handleStatusUpdate = async (invoiceId: string, newStatus: string) => {
    try {
      const result = await AdminDropPointService.updateOrderStatus(invoiceId, newStatus);
      if (result.success) {
        toast.success(`Order status updated to ${newStatus}`);
        await fetchData();
      } else {
        toast.error("Failed to update order status");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update order status");
    }
  };

  const handleDeleteOrder = async (invoiceId: string) => {
    if (!confirm(`Are you sure you want to delete order ${invoiceId}? This will release the assigned shelves.`)) {
      return;
    }
    try {
      const result = await AdminDropPointService.deleteOrder(invoiceId);
      if (result.success) {
        toast.success("Order deleted and shelves released");
        await fetchData();
      } else {
        toast.error("Failed to delete order");
      }
    } catch (error) {
      console.error("Failed to delete order:", error);
      toast.error("Failed to delete order");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading drop-point dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">All drop-point orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pendingOrders || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.processingOrders || 0}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatedCurrency(stats?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total drop-point revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Capacity Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Drop-Point Capacity Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats?.dropPoints.map((dp) => (
              <div key={dp.id} className="p-4 border rounded-lg">
                <h4 className="font-semibold">{dp.name}</h4>
                <p className="text-sm text-muted-foreground mb-2">{dp.address}</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm">Capacity</span>
                  <span className="font-medium">
                    {dp.currentCapacity}/{dp.maxCapacity}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      dp.occupancyPercentage > 80
                        ? "bg-red-500"
                        : dp.occupancyPercentage > 50
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${dp.occupancyPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dp.availableCapacity} slots available
                </p>
              </div>
            ))}
            {(!stats?.dropPoints || stats.dropPoints.length === 0) && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No drop-point locations configured
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Drop-Point Orders
            </CardTitle>

            <div className="flex flex-col md:flex-row gap-2">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  placeholder="Search invoice or marker..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[200px]"
                />
                <Button type="submit" size="icon" variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </form>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dropPointFilter} onValueChange={setDropPointFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Drop Point" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {stats?.dropPoints.map((dp) => (
                    <SelectItem key={dp.id} value={dp.id.toString()}>
                      {dp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No drop-point orders found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Marker</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">{order.invoice_id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customers?.username || "-"}</div>
                          <div className="text-xs text-muted-foreground">
                            {order.customers?.whatsapp || "-"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.customer_marking || "-"}</Badge>
                      </TableCell>
                      <TableCell>{order.drop_points?.name || "-"}</TableCell>
                      <TableCell>{order.order_item?.length || 0}</TableCell>
                      <TableCell>{formatedCurrency(order.total_price || 0)}</TableCell>
                      <TableCell>
                        <Badge variant={order.payment?.includes("Paid") ? "default" : "outline"} 
                               className={order.payment?.includes("Paid") ? "bg-green-100 text-green-800" : ""}>
                          {order.payment || "Unpaid"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"}>
                          {order.status || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(order.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Order Details - {order.invoice_id}</DialogTitle>
                              </DialogHeader>
                              <OrderDetailsContent order={order} />
                            </DialogContent>
                          </Dialog>

                          {order.status !== "finish" && (
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleStatusUpdate(order.invoice_id, value)}
                            >
                              <SelectTrigger className="w-[120px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="pickup">Pickup</SelectItem>
                                <SelectItem value="cleaning">Cleaning</SelectItem>
                                <SelectItem value="finish">Finish</SelectItem>
                              </SelectContent>
                            </Select>
                          )}

                          {(order.status === "completed" || order.status === "done" || order.status === "finish") && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Done
                            </Badge>
                          )}

                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDeleteOrder(order.invoice_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                  {pagination.total} orders
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OrderDetailsContent({ order }: { order: DropPointOrder }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-2">Customer Info</h4>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Name:</span>{" "}
              {order.customers?.username || "-"}
            </p>
            <p>
              <span className="text-muted-foreground">WhatsApp:</span>{" "}
              {order.customers?.whatsapp || "-"}
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span> {order.customers?.email || "-"}
            </p>
            <p>
              <span className="text-muted-foreground">Marker:</span>{" "}
              <Badge variant="outline">{order.customer_marking || "-"}</Badge>
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Drop-Point Info</h4>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Location:</span>{" "}
              {order.drop_points?.name || "-"}
            </p>
            <p>
              <span className="text-muted-foreground">Address:</span>{" "}
              {order.drop_points?.address || "-"}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="font-semibold mb-2">Items ({order.order_item?.length || 0})</h4>
        <div className="space-y-2">
          {order.order_item?.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div>
                <span className="font-medium">#{item.item_number}</span> - {item.shoe_name}
                <div className="text-xs text-muted-foreground">
                  Color: {item.color} | Size: {item.size}
                  {item.has_white_treatment && (
                    <Badge className="ml-2 text-xs" variant="secondary">
                      White Treatment
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div className="flex justify-between items-center">
        <span className="font-semibold">Total Amount</span>
        <span className="text-xl font-bold">{formatedCurrency(order.total_price || 0)}</span>
      </div>
    </div>
  );
}
