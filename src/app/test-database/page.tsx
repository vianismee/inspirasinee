"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface TableData {
  exists: boolean;
  count?: number;
  [key: string]: unknown;
}

interface TestResult {
  success: boolean;
  message: string;
  environment?: string;
  schema?: string;
  supabaseUrl?: string;
  database: {
    connected: boolean;
    tables: Record<string, TableData>;
    sampleData: {
      customers: number;
      orders: number;
      points: number;
    };
  };
  writePermission?: {
    success: boolean;
    error?: string;
  };
  errors?: string[];
  error?: string;
}

export default function TestDatabasePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const testDatabase = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      console.log("🚀 Starting database test...");

      const response = await fetch("/api/debug/database/test");
      const data = await response.json();

      console.log("📦 Database test response:", data);

      if (response.ok && data.success) {
        setResult(data);
        toast.success("Database test completed!");
      } else {
        toast.error(data.error || "Database test failed");
      }
    } catch (error) {
      console.error("❌ Database test error:", error);
      toast.error("Network error during database test");
    } finally {
      setIsLoading(false);
    }
  };

  const runMigrations = async () => {
    toast.info("Please run migrations manually. See MIGRATION_GUIDE.md for instructions.");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Database Setup Test</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test Database Connection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                This will test your Supabase database connection and verify that the required tables exist.
              </p>
              <div className="flex gap-2">
                <Button onClick={testDatabase} disabled={isLoading}>
                  {isLoading ? "Testing..." : "🔍 Test Database"}
                </Button>
                <Button onClick={runMigrations} variant="outline">
                  📋 Run Migrations
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <strong>Environment:</strong> {result.environment}
                </div>
                <div>
                  <strong>Schema:</strong> {result.schema}
                </div>
                <div>
                  <strong>Supabase URL:</strong> {result.supabaseUrl}
                </div>

                <div>
                  <strong>Tables Status:</strong>
                  <div className="mt-2 space-y-2">
                    {Object.entries(result.database.tables).map(([tableName, tableData]) => (
                      <div key={tableName} className={`p-3 rounded ${tableData.exists ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex justify-between items-center">
                          <strong>{tableName}:</strong>
                          <span className={`px-2 py-1 rounded text-xs ${tableData.exists ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                            {tableData.exists ? 'EXISTS' : 'MISSING'}
                          </span>
                        </div>
                        {typeof tableData.error === 'string' && (
                          <div className="text-sm text-red-600 mt-1">
                            Error: {tableData.error}
                          </div>
                        )}
                        {tableData.sampleData != null && (
                          <div className="mt-2">
                            <strong>Sample Data:</strong>
                            <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
                              {JSON.stringify(tableData.sampleData, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {result.writePermission && (
                  <div>
                    <strong>Write Permission Test:</strong>
                    <div className={`mt-2 p-3 rounded ${result.writePermission.success ? 'bg-green-50' : 'bg-red-50'}`}>
                      <span className={`px-2 py-1 rounded text-xs ${result.writePermission.success ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                        {result.writePermission.success ? '✅ WRITING WORKS' : '❌ WRITE PERMISSION DENIED'}
                      </span>
                      {result.writePermission.error && (
                        <div className="text-sm text-red-600 mt-1">
                          Error: {result.writePermission.error}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {result.errors && result.errors.length > 0 && (
                  <div>
                    <strong>Errors:</strong>
                    <div className="mt-2 space-y-1">
                      {result.errors.map((error: string, index: number) => (
                        <div key={index} className="text-sm text-red-600">
                          • {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>🚀 Quick Start</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <strong>1. Test Database:</strong>
                  <p className="text-gray-600">Click the &quot;Test Database&quot; button above</p>
                </div>
                <div>
                  <strong>2. Check Results:</strong>
                  <p className="text-gray-600">All tables should show &quot;EXISTS&quot; status</p>
                </div>
                <div>
                  <strong>3. Run Migrations:</strong>
                  <p className="text-gray-600">If tables are missing, run migrations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🔧 Run Migrations Manually</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <strong>Option 1: Supabase Dashboard</strong>
                  <p className="text-gray-600">
                    Open SQL Editor → Run migration files
                  </p>
                </div>
                <div>
                  <strong>Option 2: Migration Runner</strong>
                  <p className="text-gray-600">
                    cd migrations → npm install → npm run migrate:dev
                  </p>
                </div>
                <div>
                  <strong>Option 3: Check Server Logs</strong>
                  <p className="text-gray-600">
                    Look for table creation errors in console
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">📋 Expected Tables</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <strong>dashboard_sessions:</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Stores secure hash links</li>
                <li>• 15-minute expiry</li>
                <li>• IP and user agent tracking</li>
              </ul>
            </div>
            <div>
              <strong>dashboard_access_logs:</strong>
              <ul className="ml-4 mt-1 space-y-1">
                <li>• Audit trail</li>
                <li>• Success/failure tracking</li>
                <li>• Error logging</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}