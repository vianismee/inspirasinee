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
import { useCustomerStore } from "@/stores/customerStore";
import { Search, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { formatedCurrency } from "@/lib/utils";

export function PointTransactionsTable() {
  const { pointTransactions, pointsLoading, refreshData } = useReferralStore();
  const { customers } = useCustomerStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTransactions, setFilteredTransactions] = useState(pointTransactions);

  useEffect(() => {
    const filtered = pointTransactions.filter(
      (transaction) =>
        transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.order_invoice_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.customer_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTransactions(filtered);
  }, [pointTransactions, searchTerm]);

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.customer_id === customerId);
    return customer?.username || customerId;
  };

  const totalCredits = pointTransactions
    .filter(t => t.transaction_type === 'credit')
    .reduce((sum, t) => sum + t.points, 0);

  const totalDebits = pointTransactions
    .filter(t => t.transaction_type === 'debit')
    .reduce((sum, t) => sum + t.points, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Point Transactions
        </CardTitle>
        <CardDescription>
          View all point transactions including earnings and redemptions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-muted-foreground">Total Credits:</span>
              <Badge variant="secondary" className="bg-green-50 text-green-800">
                {totalCredits.toLocaleString('id-ID')}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-muted-foreground">Total Debits:</span>
              <Badge variant="secondary" className="bg-red-50 text-red-800">
                {totalDebits.toLocaleString('id-ID')}
              </Badge>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Related Customer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pointsLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading transactions...
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    {searchTerm ? "No transactions found matching your search." : "No transactions yet."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-sm">
                      {transaction.created_at
                        ? new Date(transaction.created_at).toLocaleDateString('id-ID')
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {getCustomerName(transaction.customer_id)}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {transaction.customer_id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={transaction.transaction_type === 'credit' ? 'default' : 'destructive'}
                        className={
                          transaction.transaction_type === 'credit'
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }
                      >
                        {transaction.transaction_type === 'credit' ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {transaction.transaction_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1">
                        {transaction.transaction_type === 'credit' ? '+' : '-'}
                        {transaction.points.toLocaleString('id-ID')}
                        <span className="text-xs text-muted-foreground">pts</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">
                      {transaction.description || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {transaction.order_invoice_id || '-'}
                    </TableCell>
                    <TableCell>
                      {transaction.related_customer_id ? (
                        <div className="flex items-center gap-1 text-sm">
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span>{getCustomerName(transaction.related_customer_id)}</span>
                        </div>
                      ) : (
                        '-'
                      )}
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
              <span className="text-muted-foreground">Total Transactions:</span>
              <div className="font-medium">{pointTransactions.length}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Credit Transactions:</span>
              <div className="font-medium text-green-600">
                {pointTransactions.filter(t => t.transaction_type === 'credit').length}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Debit Transactions:</span>
              <div className="font-medium text-red-600">
                {pointTransactions.filter(t => t.transaction_type === 'debit').length}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Net Points Flow:</span>
              <div className={`font-medium ${(totalCredits - totalDebits) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(totalCredits - totalDebits).toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}