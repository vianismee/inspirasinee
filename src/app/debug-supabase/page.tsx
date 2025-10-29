"use client";

import { SupabaseDebugPanel } from "@/components/Debug/SupabaseDebugPanel";

export default function DebugSupabasePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🔍 Supabase Debug Page
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Click "Run Debug Tests" to test Supabase connectivity</li>
            <li>Check if all tests pass - this will identify the exact issue</li>
            <li>Copy the results and share them for further analysis</li>
            <li>The debug panel will show specific error messages and codes</li>
          </ol>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This page helps identify if the issue is:
            </p>
            <ul className="list-disc list-inside text-sm text-yellow-700 mt-2">
              <li>RLS policy problems</li>
              <li>Environment variable issues</li>
              <li>Table/column name mismatches</li>
              <li>Network connectivity problems</li>
              <li>Permission issues</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Tests:</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded">
              <h3 className="font-semibold text-blue-600">Tracking System</h3>
              <p className="text-sm text-gray-600 mt-1">
                Tests queries used by: /tracking/[slug]
              </p>
            </div>

            <div className="p-4 border rounded">
              <h3 className="font-semibold text-green-600">Customer Dashboard</h3>
              <p className="text-sm text-gray-600 mt-1">
                Tests queries used by: /customer-dashboard/[hash]
              </p>
            </div>

            <div className="p-4 border rounded">
              <h3 className="font-semibold text-purple-600">Environment</h3>
              <p className="text-sm text-gray-600 mt-1">
                Checks environment variables and connection
              </p>
            </div>

            <div className="p-4 border rounded">
              <h3 className="font-semibold text-orange-600">RLS Policies</h3>
              <p className="text-sm text-gray-600 mt-1">
                Tests if RLS policies are working correctly
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Panel */}
      <SupabaseDebugPanel />
    </div>
  );
}