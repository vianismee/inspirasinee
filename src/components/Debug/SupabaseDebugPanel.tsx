"use client";

import { useState, useEffect } from "react";
import { supabaseDebugger } from "@/utils/client/debug-supabase";
import { logger } from "@/utils/client/logger";

export function SupabaseDebugPanel() {
  const [debugResults, setDebugResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const runDebugTests = async () => {
    setIsLoading(true);
    setDebugResults(null);

    try {
      logger.info("Starting comprehensive Supabase debug", {}, "SupabaseDebugPanel");

      // Run basic connection tests
      const connectionResults = await supabaseDebugger.testConnection();

      // Run specific query tests
      const queryResults = await supabaseDebugger.testSpecificQueries();

      // Get environment info
      const envInfo = await supabaseDebugger.getEnvironmentInfo();

      const allResults = {
        connection: connectionResults,
        queries: queryResults,
        environment: envInfo,
        timestamp: new Date().toISOString(),
        overallSuccess: connectionResults.success && queryResults.success
      };

      setDebugResults(allResults);

      logger.info("Debug tests completed", allResults, "SupabaseDebugPanel");

    } catch (error) {
      logger.error("Debug tests failed", { error }, "SupabaseDebugPanel");
      setDebugResults({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        overallSuccess: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    logger.info("Debug results copied to clipboard", {}, "SupabaseDebugPanel");
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border-2 border-red-500 rounded-lg shadow-lg p-4 max-w-md">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-red-600">🔍 Supabase Debug Panel</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs bg-gray-200 px-2 py-1 rounded"
        >
          {showDetails ? 'Hide' : 'Show'}
        </button>
      </div>

      <button
        onClick={runDebugTests}
        disabled={isLoading}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 mb-2"
      >
        {isLoading ? '🔄 Running Tests...' : '🧪 Run Debug Tests'}
      </button>

      {debugResults && (
        <div className="space-y-2">
          <div className={`p-2 rounded ${debugResults.overallSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <div className="font-semibold">
              {debugResults.overallSuccess ? '✅ All Tests Passed' : '❌ Some Tests Failed'}
            </div>
            <div className="text-xs">
              {debugResults.timestamp}
            </div>
          </div>

          {debugResults.environment && (
            <div className="bg-gray-50 p-2 rounded text-xs">
              <div className="font-semibold mb-1">Environment:</div>
              <div>Supabase URL: {debugResults.environment.environment?.supabaseUrl}</div>
              <div>Supabase Key: {debugResults.environment.environment?.supabaseKey}</div>
              <div>App Env: {debugResults.environment.environment?.appEnv}</div>
              <div>Connection: {debugResults.environment.connection?.canConnect ? '✅' : '❌'}</div>
              {debugResults.environment.connection?.error && (
                <div className="text-red-600 mt-1">
                  Error: {debugResults.environment.connection.error.message}
                </div>
              )}
            </div>
          )}

          {showDetails && (
            <div className="space-y-2">
              {debugResults.connection && (
                <div className="bg-gray-50 p-2 rounded text-xs">
                  <div className="font-semibold mb-1">
                    Connection Tests ({debugResults.connection.passedTests}/{debugResults.connection.totalTests}):
                  </div>
                  {debugResults.connection.results.map((result: any, i: number) => (
                    <div key={i} className="text-green-600">✅ {result.test}</div>
                  ))}
                  {debugResults.connection.errors.map((error: any, i: number) => (
                    <div key={i} className="text-red-600">
                      ❌ {error.test}: {error.message}
                    </div>
                  ))}
                </div>
              )}

              {debugResults.queries && (
                <div className="bg-gray-50 p-2 rounded text-xs">
                  <div className="font-semibold mb-1">
                    Query Tests ({debugResults.queries.passedTests}/{debugResults.queries.totalTests}):
                  </div>
                  {debugResults.queries.results.map((result: any, i: number) => (
                    <div key={i} className="text-green-600">✅ {result.test}</div>
                  ))}
                  {debugResults.queries.errors.map((error: any, i: number) => (
                    <div key={i} className="text-red-600">
                      ❌ {error.test}: {error.message}
                      {error.code && <span> (Code: {error.code})</span>}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => copyToClipboard(JSON.stringify(debugResults, null, 2))}
                className="w-full bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
              >
                📋 Copy Full Results
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}