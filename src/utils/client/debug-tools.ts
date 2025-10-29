import { performHealthCheck, testBasicConnectivity, HealthCheckResult } from "./health-check";
import { validateEnvironment, EnvironmentValidationResult, getDeviceInfo } from "./env-validation";
import { logger, logInfo, logWarn, logError } from "./logger";

export interface DebugInfo {
  timestamp: string;
  sessionInfo: {
    sessionId: string;
    userAgent: string;
    platform: string;
    language: string;
    cookieEnabled: boolean;
    onLine: boolean;
  };
  environment: EnvironmentValidationResult;
  health: HealthCheckResult;
  logs: {
    total: number;
    recent: Array<{
      timestamp: string;
      level: string;
      message: string;
      context?: string;
    }>;
    byLevel: Record<string, number>;
  };
}

export class ClientDebugTools {
  private static instance: ClientDebugTools;

  private constructor() {}

  public static getInstance(): ClientDebugTools {
    if (!ClientDebugTools.instance) {
      ClientDebugTools.instance = new ClientDebugTools();
    }
    return ClientDebugTools.instance;
  }

  /**
   * Run a comprehensive diagnostic check
   */
  public async runDiagnostics(): Promise<DebugInfo> {
    logInfo("Starting comprehensive diagnostics", {}, "DebugTools");

    const deviceInfo = getDeviceInfo();
    const environment = validateEnvironment();
    const health = await performHealthCheck();
    const logStats = logger.getLogStats();
    const recentLogs = logger.getLogs(undefined, undefined, 20);

    const debugInfo: DebugInfo = {
      timestamp: new Date().toISOString(),
      sessionInfo: {
        sessionId: logStats.sessionId,
        userAgent: deviceInfo.userAgent,
        platform: deviceInfo.platform,
        language: deviceInfo.language || 'N/A',
        cookieEnabled: deviceInfo.cookieEnabled || false,
        onLine: deviceInfo.onLine || false
      },
      environment,
      health,
      logs: {
        total: logStats.total,
        recent: recentLogs.map(log => ({
          timestamp: log.timestamp,
          level: this.getLevelName(log.level),
          message: log.message,
          context: log.context
        })),
        byLevel: {
          DEBUG: logStats.byLevel[0],
          INFO: logStats.byLevel[1],
          WARN: logStats.byLevel[2],
          ERROR: logStats.byLevel[3]
        }
      }
    };

    // Log warnings for any issues found
    if (environment.issues.length > 0) {
      logWarn("Environment issues detected", environment.issues, "DebugTools");
    }

    if (health.issues.length > 0) {
      logWarn("Health check issues detected", health.issues, "DebugTools");
    }

    logInfo("Diagnostics completed", {
      environmentIssues: environment.issues.length,
      healthIssues: health.issues.length,
      logCount: logStats.total
    }, "DebugTools");

    return debugInfo;
  }

  /**
   * Quick connectivity test
   */
  public async testConnectivity() {
    logInfo("Testing basic connectivity", {}, "DebugTools");
    const result = await testBasicConnectivity();

    if (result.connected) {
      logInfo("Connectivity test passed", { latency: result.latency }, "DebugTools");
    } else {
      logError("Connectivity test failed", { error: result.error }, "DebugTools");
    }

    return result;
  }

  /**
   * Test a specific API operation
   */
  public async testApiOperation<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<{ success: boolean; result?: T; error?: string; duration: number }> {
    const startTime = Date.now();
    logInfo(`Testing API operation: ${operationName}`, {}, "DebugTools");

    try {
      const result = await operation();
      const duration = Date.now() - startTime;

      logInfo(`API operation successful: ${operationName}`, { duration }, "DebugTools");
      return { success: true, result, duration };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      logError(`API operation failed: ${operationName}`, { error: errorMessage, duration }, "DebugTools");
      return { success: false, error: errorMessage, duration };
    }
  }

  /**
   * Export all debug information for support
   */
  public async exportDebugInfo(): Promise<string> {
    const debugInfo = await this.runDiagnostics();
    const allLogs = logger.exportLogs();

    const exportData = {
      debugInfo,
      allLogs: JSON.parse(allLogs),
      exportedAt: new Date().toISOString()
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Clear all debug data
   */
  public clearDebugData(): void {
    logger.clearLogs();
    logInfo("Debug data cleared", {}, "DebugTools");
  }

  /**
   * Get current debug status summary
   */
  public async getStatusSummary(): Promise<{
    environment: "ok" | "warning" | "error";
    health: "ok" | "warning" | "error";
    connectivity: "ok" | "warning" | "error";
    logs: "ok" | "warning" | "error";
  }> {
    const environment = validateEnvironment();
    const health = await performHealthCheck();
    const connectivity = await testBasicConnectivity();
    const logStats = logger.getLogStats();

    const getLevel = (isOk: boolean, hasWarnings: boolean) => {
      if (isOk) return "ok";
      return hasWarnings ? "warning" : "error";
    };

    return {
      environment: getLevel(
        environment.summary.allRequiredVarsSet,
        environment.issues.length > 0 && environment.summary.allRequiredVarsSet
      ),
      health: getLevel(
        health.status === "healthy",
        health.status === "unhealthy"
      ),
      connectivity: getLevel(
        connectivity.connected,
        false
      ),
      logs: getLevel(
        logStats.byLevel[3] === 0, // No errors
        logStats.byLevel[2] > 0 // Has warnings
      )
    };
  }

  private getLevelName(level: number): string {
    switch (level) {
      case 0: return "DEBUG";
      case 1: return "INFO";
      case 2: return "WARN";
      case 3: return "ERROR";
      default: return "UNKNOWN";
    }
  }
}

// Singleton instance
export const debugTools = ClientDebugTools.getInstance();

// Convenience functions for common debugging tasks
export const runDiagnostics = () => debugTools.runDiagnostics();
export const testConnectivity = () => debugTools.testConnectivity();
export const exportDebugInfo = () => debugTools.exportDebugInfo();
export const getStatusSummary = () => debugTools.getStatusSummary();