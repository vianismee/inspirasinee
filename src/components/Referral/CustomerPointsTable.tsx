"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useReferralStore } from "@/stores/referralStore";
import { Search, Users, Gift } from "lucide-react";
import { formatedCurrency } from "@/lib/utils";

export function CustomerPointsTable() {
  const { customerPointsSummary, pointsLoading, refreshData } = useReferralStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState(customerPointsSummary);

  useEffect(() => {
    const filtered = customerPointsSummary.filter(
      (customer) =>
        customer.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.whatsapp.includes(searchTerm) ||
        customer.customer_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [customerPointsSummary, searchTerm]);

  const totalPoints = customerPointsSummary.reduce((sum, customer) => sum + customer.points_balance, 0);
  const averagePoints = customerPointsSummary.length > 0 ? totalPoints / customerPointsSummary.length : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Customer Points
        </CardTitle>
        <CardDescription>
          View and manage customer point balances
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, WhatsApp, or customer ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Total Points:</span>
              <Badge variant="secondary">{totalPoints.toLocaleString('id-ID')}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Average:</span>
              <Badge variant="outline">{Math.round(averagePoints).toLocaleString('id-ID')}</Badge>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead className="text-right">Points Balance</TableHead>
                <TableHead className="text-right">Point Value</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pointsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading customer points...
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    {searchTerm ? "No customers found matching your search." : "No customers have points yet."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.customer_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        {customer.username}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {customer.customer_id}
                    </TableCell>
                    <TableCell>{customer.whatsapp}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Gift className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {customer.points_balance.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatedCurrency(customer.points_balance * 100)} {/* Assuming 1 point = Rp 100 */}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {customer.points_updated_at
                        ? new Date(customer.points_updated_at).toLocaleDateString('id-ID')
                        : 'Never'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Customers:</span>
              <div className="font-medium">{customerPointsSummary.length}</div>
            </div>
            <div>
              <span className="text-muted-foreground">With Points:</span>
              <div className="font-medium">
                {customerPointsSummary.filter(c => c.points_balance > 0).length}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Zero Balance:</span>
              <div className="font-medium">
                {customerPointsSummary.filter(c => c.points_balance === 0).length}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">High Balance (&gt;100):</span>
              <div className="font-medium">
                {customerPointsSummary.filter(c => c.points_balance > 100).length}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}