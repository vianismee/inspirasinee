"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";

interface CustomerRecord {
  customer_id: string;
  name?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  created_at?: string;
  [key: string]: unknown;
}

interface PointsRecord {
  id: string;
  customer_id: string;
  current_balance: number;
  total_earned: number;
  total_redeemed: number;
  last_updated?: string;
  [key: string]: unknown;
}

interface OrderRecord {
  id: string;
  customer_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  [key: string]: unknown;
}

interface TransactionRecord {
  id: string;
  customer_id: string;
  transaction_type: string;
  points: number;
  description?: string;
  created_at: string;
  [key: string]: unknown;
}

interface DebugData {
  customers: CustomerRecord[];
  points: PointsRecord[];
  orders: OrderRecord[];
  transactions: TransactionRecord[];
}

export default function DebugDatabase() {
  const [debugData, setDebugData] = useState<DebugData>({
    customers: [],
    points: [],
    orders: [],
    transactions: []
  });
  const [loading, setLoading] = useState(false);
  const [searchPhone, setSearchPhone] = useState("");

  const fetchDebugData = async () => {
    setLoading(true);
    try {
      const supabase = await createClient();

      console.log("🔍 Fetching debug data from database...");

      // Fetch customers
      const { data: customers, error: customersError } = await supabase
        .from("customers")
        .select("*")
        .limit(10);

      console.log("📊 Customers:", { data: customers, error: customersError });

      // Fetch points
      const { data: points, error: pointsError } = await supabase
        .from("customer_points")
        .select("*")
        .limit(10);

      console.log("📊 Points:", { data: points, error: pointsError });

      // Fetch orders
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            product_name,
            quantity,
            price,
            total_price
          )
        `)
        .limit(10);

      console.log("📊 Orders:", { data: orders, error: ordersError });

      // Fetch transactions
      const { data: transactions, error: transactionsError } = await supabase
        .from("points_transactions")
        .select("*")
        .limit(10);

      console.log("📊 Transactions:", { data: transactions, error: transactionsError });

      setDebugData({
        customers: customers || [],
        points: points || [],
        orders: orders || [],
        transactions: transactions || []
      });

    } catch (error) {
      console.error("Error fetching debug data:", error);
    } finally {
      setLoading(false);
    }
  };

  const testCustomerLookup = async () => {
    if (!searchPhone) return;

    setLoading(true);
    try {
      const supabase = await createClient();

      // Normalize phone number
      const normalizePhone = (phone: string) => {
        return phone.replace(/^\+62/, '62').replace(/[^0-9]/g, '');
      };

      const normalizedPhone = normalizePhone(searchPhone);
      console.log("📱 Phone normalization:", { original: searchPhone, normalized: normalizedPhone });

      console.log("🔍 Testing customer lookup for phone:", { original: searchPhone, normalized: normalizedPhone });

      // Test by customer_id field with original phone
      const { data: byCustomerId1, error: error1 } = await supabase
        .from("customers")
        .select("*")
        .eq("customer_id", searchPhone)
        .maybeSingle();

      console.log("📊 By customer_id (original):", { data: byCustomerId1, error: error1 });

      // Test by customer_id field with normalized phone
      const { data: byCustomerId2, error: error2 } = await supabase
        .from("customers")
        .select("*")
        .eq("customer_id", normalizedPhone)
        .maybeSingle();

      console.log("📊 By customer_id (normalized):", { data: byCustomerId2, error: error2 });

      // Test by phone field with both formats
      const { data: byPhone1, error: error3 } = await supabase
        .from("customers")
        .select("*")
        .eq("phone", searchPhone)
        .maybeSingle();

      console.log("📊 By phone (original):", { data: byPhone1, error: error3 });

      const { data: byPhone2, error: error4 } = await supabase
        .from("customers")
        .select("*")
        .eq("phone", normalizedPhone)
        .maybeSingle();

      console.log("📊 By phone (normalized):", { data: byPhone2, error: error4 });

      // Test by whatsapp field with both formats
      const { data: byWhatsapp1, error: error5 } = await supabase
        .from("customers")
        .select("*")
        .eq("whatsapp", searchPhone)
        .maybeSingle();

      console.log("📊 By whatsapp (original):", { data: byWhatsapp1, error: error5 });

      const { data: byWhatsapp2, error: error6 } = await supabase
        .from("customers")
        .select("*")
        .eq("whatsapp", normalizedPhone)
        .maybeSingle();

      console.log("📊 By whatsapp (normalized):", { data: byWhatsapp2, error: error6 });

      // If we found a customer, test their related data
      const customer = byCustomerId1 || byCustomerId2 || byPhone1 || byPhone2 || byWhatsapp1 || byWhatsapp2;
      if (customer) {
        const customerId = customer.customer_id;
        console.log("✅ Found customer, testing related data for:", customerId);

        // Test points lookup
        const { data: points, error: pointsError } = await supabase
          .from("customer_points")
          .select("*")
          .eq("customer_id", customerId)
          .maybeSingle();

        console.log("📊 Points for customer:", { data: points, error: pointsError });

        // Test orders lookup
        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .eq("customer_id", customerId)
          .limit(5);

        console.log("📊 Orders for customer:", { data: orders, error: ordersError });

        // Test transactions lookup
        const { data: transactions, error: transactionsError } = await supabase
          .from("points_transactions")
          .select("*")
          .eq("customer_id", customerId)
          .limit(5);

        console.log("📊 Transactions for customer:", { data: transactions, error: transactionsError });
      } else {
        console.log("❌ No customer found with any phone format");

        // Show sample customers for reference
        const { data: sampleCustomers, error: sampleError } = await supabase
          .from("customers")
          .select("customer_id, customer_name, phone, whatsapp")
          .limit(3);

        console.log("📋 Sample customers for reference:", { data: sampleCustomers, error: sampleError });
      }

    } catch (error) {
      console.error("Error testing customer lookup:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Database Debug Console</h1>

        {/* Search Test */}
        <Card>
          <CardHeader>
            <CardTitle>Test Customer Lookup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter phone number to test lookup"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
              />
              <Button onClick={testCustomerLookup} disabled={loading}>
                Test Lookup
              </Button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Check browser console for detailed debug output
            </p>
          </CardContent>
        </Card>

        {/* Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Customers ({debugData.customers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <pre className="text-xs bg-gray-100 p-4 rounded">
                {JSON.stringify(debugData.customers, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Points */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Points ({debugData.points.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <pre className="text-xs bg-gray-100 p-4 rounded">
                {JSON.stringify(debugData.points, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Orders ({debugData.orders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <pre className="text-xs bg-gray-100 p-4 rounded">
                {JSON.stringify(debugData.orders, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Points Transactions ({debugData.transactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <pre className="text-xs bg-gray-100 p-4 rounded">
                {JSON.stringify(debugData.transactions, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button onClick={fetchDebugData} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh Data"}
          </Button>
          <Button variant="outline" onClick={() => window.location.href = "/customer-dashboard"}>
            Back to Dashboard
          </Button>
        </div>

        <p className="text-sm text-gray-600 text-center">
          Open browser console to see detailed debug logs
        </p>
      </div>
    </div>
  );
}