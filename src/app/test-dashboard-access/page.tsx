"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface TestResult {
  success: boolean;
  message?: string;
  hash?: string;
  customerData?: {
    customer_id: string;
    name?: string;
    phone?: string;
  };
  error?: string;
  dashboardData?: unknown;
  directAccess?: unknown;
}

export default function TestDashboardAccessPage() {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  const testPhoneValidation = async () => {
    if (!phone) {
      toast.error("Please enter a phone number");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setLogs([]);

    addLog("🚀 Starting phone validation test");

    try {
      addLog(`📞 Testing phone: ${phone}`);

      const response = await fetch("/api/referral/dashboard/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      addLog(`📡 Response status: ${response.status}`);

      const data = await response.json();
      addLog(`📦 Response data: ${JSON.stringify(data, null, 2)}`);

      if (response.ok && data.success) {
        addLog("✅ Phone validation successful!");
        setResult(data);
        toast.success("Phone validation successful!");

        // Test dashboard access
        if (data.redirectTo) {
          addLog(`🔗 Redirect URL: ${data.redirectTo}`);
          const hash = data.redirectTo.split('/').pop();
          addLog(`🔐 Testing dashboard access with hash: ${hash}`);

          try {
            const dashboardResponse = await fetch(`/api/referral/dashboard/access/${hash}`);
            addLog(`📡 Dashboard response status: ${dashboardResponse.status}`);

            const dashboardData = await dashboardResponse.json();
            addLog(`📦 Dashboard response data: ${JSON.stringify(dashboardData, null, 2)}`);

            if (dashboardResponse.ok && dashboardData.success) {
              addLog("✅ Dashboard access successful!");
              setResult(prev => ({ ...prev, success: true, dashboardData }));
            } else {
              addLog(`❌ Dashboard access failed: ${dashboardData.error}`);
            }
          } catch (error) {
            addLog(`❌ Error testing dashboard access: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      } else {
        addLog(`❌ Phone validation failed: ${data.error}`);
        toast.error(data.error || "Validation failed");
      }
    } catch (error) {
      addLog(`❌ Network error: ${error instanceof Error ? error.message : String(error)}`);
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectDashboardAccess = async () => {
    if (!phone) {
      toast.error("Please enter a phone number");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setLogs([]);

    addLog("🚀 Starting direct dashboard access test");

    try {
      addLog(`📞 Testing phone: ${phone}`);

      const response = await fetch(`/api/referral/dashboard/access/${phone}`);
      addLog(`📡 Response status: ${response.status}`);

      const data = await response.json();
      addLog(`📦 Response data: ${JSON.stringify(data, null, 2)}`);

      if (response.ok && data.success) {
        addLog("✅ Direct dashboard access successful!");
        setResult({ success: true, directAccess: data });
        toast.success("Direct dashboard access successful!");
      } else {
        addLog(`❌ Direct dashboard access failed: ${data.error}`);
        toast.error(data.error || "Direct access failed");
      }
    } catch (error) {
      addLog(`❌ Network error: ${error instanceof Error ? error.message : String(error)}`);
      toast.error("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard Access Debug Tool</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test Phone Number Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number:</label>
                <Input
                  placeholder="Enter phone number to test"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="max-w-md"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={testPhoneValidation} disabled={isLoading}>
                  {isLoading ? "Testing..." : "1. Test Full Flow"}
                </Button>
                <Button onClick={testDirectDashboardAccess} disabled={isLoading} variant="outline">
                  {isLoading ? "Testing..." : "2. Test Direct Access"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {logs.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Debug Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs max-h-64 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">📋 How to Use</h3>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Enter a phone number that exists in your database</li>
            <li>Click &quot;Test Full Flow&quot; to test the complete verification process</li>
            <li>Click &quot;Test Direct Access&quot; to test direct dashboard access</li>
            <li>Check the browser console and debug logs for detailed information</li>
            <li>Check the server console logs for comprehensive debugging information</li>
          </ol>
        </div>
      </div>
    </div>
  );
}