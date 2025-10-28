"use client";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Headers } from "@/components/MainComponent/Header";
import { Search, Users } from "lucide-react";
import { toast } from "sonner";

interface CustomerPoints {
  id: number;
  customer_id: string;
  current_balance: number;
  total_earned: number;
  total_redeemed: number;
  created_at: string;
  updated_at: string;
  customer: {
    username: string;
    email: string;
    whatsapp: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function CustomerPointsManagementPage() {
  const [customers, setCustomers] = useState<CustomerPoints[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerPoints | null>(null);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);

  // Adjustment form state
  const [adjustmentForm, setAdjustmentForm] = useState({
    pointsChange: 0,
    description: ""
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/admin/referral/customers?${params}`);
      const data = await response.json();

      if (response.ok) {
        setCustomers(data.customers);
        setPagination(prev => ({
          ...prev,
          total: data.total,
          totalPages: Math.ceil(data.total / pagination.limit)
        }));
      } else {
        toast.error(data.error || "Failed to fetch customer points");
      }
    } catch (error) {
      console.error("Error fetching customer points:", error);
      toast.error("Failed to fetch customer points");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm]);

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, searchTerm, fetchCustomers]);

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    try {
      const response = await fetch("/api/admin/referral/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: selectedCustomer.customer_id,
          pointsChange: adjustmentForm.pointsChange,
          description: adjustmentForm.description
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setAdjustmentOpen(false);
        setAdjustmentForm({ pointsChange: 0, description: "" });
        setSelectedCustomer(null);
        fetchCustomers();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to adjust points");
      }
    } catch (error) {
      console.error("Error adjusting points:", error);
      toast.error("Failed to adjust points");
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  if (loading) {
    return (
      <div className="w-full h-screen px-[30px] py-[30px]">
        <div className="flex flex-col gap-4">
          <Headers
            title="Customer Points Management"
            desc="Manage customer points and view transaction history"
          />
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen px-[30px] py-[30px]">
      <div className="flex flex-col gap-6">
        <Headers
          title="Customer Points Management"
          desc="Manage customer points and view transaction history"
        />

        {/* Search and Stats */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {pagination.total} customers with points
            </span>
          </div>
        </div>

        {/* Customer Points Table */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Points</CardTitle>
            <CardDescription>
              View and manage points for all customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Current Balance</TableHead>
                  <TableHead>Total Earned</TableHead>
                  <TableHead>Total Redeemed</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.customer.username}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer.customer_id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{customer.customer.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer.customer.whatsapp}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={customer.current_balance > 0 ? "default" : "secondary"}>
                        {customer.current_balance} points
                      </Badge>
                    </TableCell>
                    <TableCell>{customer.total_earned}</TableCell>
                    <TableCell>{customer.total_redeemed}</TableCell>
                    <TableCell>{formatDate(customer.updated_at)}</TableCell>
                    <TableCell>
                      <Dialog open={adjustmentOpen && selectedCustomer?.id === customer.id} onOpenChange={setAdjustmentOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            Adjust
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Adjust Customer Points</DialogTitle>
                            <DialogDescription>
                              Adjust points for {selectedCustomer?.customer.username}
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleAdjustment} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="pointsChange">Points Change</Label>
                              <Input
                                id="pointsChange"
                                type="number"
                                value={adjustmentForm.pointsChange}
                                onChange={(e) => setAdjustmentForm(prev => ({
                                  ...prev,
                                  pointsChange: parseInt(e.target.value) || 0
                                }))}
                                placeholder="Enter positive or negative value"
                              />
                              <p className="text-sm text-muted-foreground">
                                Use positive values to add points, negative to remove
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="description">Description</Label>
                              <Textarea
                                id="description"
                                value={adjustmentForm.description}
                                onChange={(e) => setAdjustmentForm(prev => ({
                                  ...prev,
                                  description: e.target.value
                                }))}
                                placeholder="Reason for adjustment"
                                rows={3}
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  setAdjustmentOpen(false);
                                  setAdjustmentForm({ pointsChange: 0, description: "" });
                                }}
                              >
                                Cancel
                              </Button>
                              <Button type="submit">
                                Adjust Points
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                  {pagination.total} results
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <div className="flex gap-1">
                    {[...Array(pagination.pages)].map((_, i) => (
                      <Button
                        key={i + 1}
                        variant={pagination.page === i + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}