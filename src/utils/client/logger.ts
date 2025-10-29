export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  error?: Error;
  sessionId: string;
}

export class ClientLogger {
  private static instance: ClientLogger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs
  private sessionId: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  public static getInstance(): ClientLogger {
    if (!ClientLogger.instance) {
      ClientLogger.instance = new ClientLogger();
    }
    return ClientLogger.instance;
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private setupGlobalErrorHandlers(): void {
    if (typeof window !== 'undefined') {
      // Catch unhandled errors
      window.addEventListener('error', (event) => {
        this.error('Unhandled Error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }, 'Global');
      });

      // Catch unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled Promise Rejection', {
          reason: event.reason
        }, 'Global');
      });
    }
  }

  private addLog(level: LogLevel, message: string, data?: unknown, context?: string, error?: Error): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
      error,
      sessionId: this.sessionId
    };

    this.logs.push(logEntry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to console in development
    if (process.env.NEXT_PUBLIC_APP_ENV === 'development') {
      this.logToConsole(logEntry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.context || 'App'}]`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.data);
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(prefix, entry.message, entry.error || entry.data);
        break;
    }
  }

  public debug(message: string, data?: unknown, context?: string): void {
    this.addLog(LogLevel.DEBUG, message, data, context);
  }

  public info(message: string, data?: unknown, context?: string): void {
    this.addLog(LogLevel.INFO, message, data, context);
  }

  public warn(message: string, data?: unknown, context?: string): void {
    this.addLog(LogLevel.WARN, message, data, context);
  }

  public error(message: string, data?: unknown, context?: string, error?: Error): void {
    this.addLog(LogLevel.ERROR, message, data, context, error);
  }

  public getLogs(level?: LogLevel, context?: string, limit?: number): LogEntry[] {
    let filteredLogs = this.logs;

    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= level);
    }

    if (context) {
      filteredLogs = filteredLogs.filter(log => log.context === context);
    }

    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }

    return filteredLogs;
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public exportLogs(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      exportedAt: new Date().toISOString(),
      logs: this.logs
    }, null, 2);
  }

  public getLogStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    byContext: Record<string, number>;
    sessionId: string;
  } {
    const stats = {
      total: this.logs.length,
      byLevel: {
        [LogLevel.DEBUG]: 0,
        [LogLevel.INFO]: 0,
        [LogLevel.WARN]: 0,
        [LogLevel.ERROR]: 0
      },
      byContext: {} as Record<string, number>,
      sessionId: this.sessionId
    };

    this.logs.forEach(log => {
      stats.byLevel[log.level]++;
      if (log.context) {
        stats.byContext[log.context] = (stats.byContext[log.context] || 0) + 1;
      }
    });

    return stats;
  }
}

// Singleton instance
export const logger = ClientLogger.getInstance();

// Convenience functions
export const logDebug = (message: string, data?: unknown, context?: string) => logger.debug(message, data, context);
export const logInfo = (message: string, data?: unknown, context?: string) => logger.info(message, data, context);
export const logWarn = (message: string, data?: unknown, context?: string) => logger.warn(message, data, context);
export const logError = (message: string, data?: unknown, context?: string, error?: Error) => logger.error(message, data, context, error);