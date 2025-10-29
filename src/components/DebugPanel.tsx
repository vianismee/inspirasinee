"use client";

import { useState, useEffect } from "react";
import { runDiagnostics, testConnectivity, exportDebugInfo } from "@/utils/client/debug-tools";
import { logger } from "@/utils/client/logger";

function DebugPanelContent() {
  const [diagnostics, setDiagnostics] = useState<Awaited<ReturnType<typeof runDiagnostics>> | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRunDiagnostics = async () => {
    setLoading(true);
    try {
      const result = await runDiagnostics();
      setDiagnostics(result);
    } catch (error) {
      logger.error("Failed to run diagnostics", { error }, "DebugPanel");
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnectivity = async () => {
    setLoading(true);
    try {
      const result = await testConnectivity();
      logger.info("Connectivity test result", result, "DebugPanel");
    } catch (error) {
      logger.error("Connectivity test failed", { error }, "DebugPanel");
    } finally {
      setLoading(false);
    }
  };

  const handleExportDebugInfo = async () => {
    try {
      const debugInfo = await exportDebugInfo();
      const blob = new Blob([debugInfo], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `debug-info-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error("Failed to export debug info", { error }, "DebugPanel");
    }
  };

  // Auto-run diagnostics when component mounts
  useEffect(() => {
    handleRunDiagnostics();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white border border-gray-300 rounded-lg shadow-xl z-50 overflow-hidden">
      <div className="bg-gray-800 text-white p-2 flex justify-between items-center">
        <h3 className="font-bold">Debug Panel</h3>
        <div className="flex gap-2">
          <button
            onClick={handleRunDiagnostics}
            className="text-white hover:text-gray-300 text-sm"
            title="Refresh"
          >
            🔄
          </button>
        </div>
      </div>

      <div className="p-4 overflow-y-auto max-h-80">
        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-sm text-gray-600">Running diagnostics...</p>
          </div>
        )}

        {!loading && (
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleRunDiagnostics}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              >
                Run Diagnostics
              </button>
              <button
                onClick={handleTestConnectivity}
                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
              >
                Test Connectivity
              </button>
              <button
                onClick={handleExportDebugInfo}
                className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
              >
                Export Debug Info
              </button>
            </div>

            {diagnostics && (
              <div className="space-y-2 text-xs">
                <div className="border-b pb-2">
                  <h4 className="font-bold">Environment</h4>
                  <div className="space-y-1">
                    <p>App Env: {diagnostics.environment.environment.app_env}</p>
                    <p>All Required Set: {diagnostics.environment.summary.allRequiredVarsSet ? "✅" : "❌"}</p>
                    <p>Supabase Configured: {diagnostics.environment.summary.supabaseConfigured ? "✅" : "❌"}</p>
                    {diagnostics.environment.issues.length > 0 && (
                      <details className="text-red-600">
                        <summary className="cursor-pointer">Issues ({diagnostics.environment.issues.length})</summary>
                        <ul className="ml-4 list-disc">
                          {diagnostics.environment.issues.map((issue, i: number) => (
                            <li key={i}>{issue}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </div>

                <div className="border-b pb-2">
                  <h4 className="font-bold">Health Check</h4>
                  <div className="space-y-1">
                    <p>Status: {diagnostics.health.status}</p>
                    <p>Connected: {diagnostics.health.connectivity?.connected ? "✅" : "❌"}</p>
                    {diagnostics.health.connectivity?.latency && (
                      <p>Latency: {diagnostics.health.connectivity.latency}ms</p>
                    )}
                    {diagnostics.health.issues.length > 0 && (
                      <details className="text-red-600">
                        <summary className="cursor-pointer">Issues ({diagnostics.health.issues.length})</summary>
                        <ul className="ml-4 list-disc">
                          {diagnostics.health.issues.map((issue, i: number) => (
                            <li key={i}>{issue}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </div>

                <div className="border-b pb-2">
                  <h4 className="font-bold">Session Info</h4>
                  <div className="space-y-1">
                    <p>Session ID: {diagnostics.sessionInfo.sessionId}</p>
                    <p>Platform: {diagnostics.sessionInfo.platform}</p>
                    <p>Online: {diagnostics.sessionInfo.onLine ? "✅" : "❌"}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold">Recent Logs</h4>
                  <div className="space-y-1">
                    <p>Total: {diagnostics.logs.total}</p>
                    <p>Errors: {diagnostics.logs.byLevel.ERROR}</p>
                    <p>Warnings: {diagnostics.logs.byLevel.WARN}</p>
                    {diagnostics.logs.recent.length > 0 && (
                      <details>
                        <summary className="cursor-pointer">Recent Logs</summary>
                        <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                          {diagnostics.logs.recent.map((log, i: number) => (
                            <div key={i} className="text-gray-600">
                              <span className="text-gray-400">[{log.timestamp}]</span>
                              <span className={`ml-1 ${
                                log.level === "ERROR" ? "text-red-600" :
                                log.level === "WARN" ? "text-yellow-600" :
                                log.level === "INFO" ? "text-blue-600" : "text-gray-500"
                              }`}>
                                [{log.level}]
                              </span>
                              <span className="ml-1">{log.message}</span>
                              {log.context && <span className="text-gray-400 ml-1">({log.context})</span>}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function DebugPanel() {
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development
  if (process.env.NEXT_PUBLIC_APP_ENV !== "development") {
    return null;
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-lg shadow-lg z-50 hover:bg-blue-600"
        title="Open Debug Panel"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <>
      <DebugPanelContent />
      <button
        onClick={() => setIsVisible(false)}
        className="fixed bottom-4 right-80 bg-red-500 text-white p-2 rounded-lg shadow-lg z-50 hover:bg-red-600"
        title="Close Debug Panel"
      >
        ✕
      </button>
    </>
  );
}