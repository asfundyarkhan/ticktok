/**
 * Logger utility for consistent logging across the application
 * Helps with debugging and tracing issues in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Configure log levels that should be visible
const VISIBLE_LOG_LEVELS: LogLevel[] = ['info', 'warn', 'error'];

// Enable debug logs in development
if (process.env.NODE_ENV === 'development') {
  VISIBLE_LOG_LEVELS.push('debug');
}

/**
 * Logger class with methods for different log levels
 * and specialized loggers for specific features
 */
export class Logger {
  private prefix: string;

  constructor(prefix: string = '') {
    this.prefix = prefix ? `[${prefix}] ` : '';
  }

  /**
   * Log at debug level - only shown in development
   */
  debug(message: string, ...data: unknown[]): void {
    if (VISIBLE_LOG_LEVELS.includes('debug')) {
      console.log(`${this.prefix}${message}`, ...data);
    }
  }

  /**
   * Log at info level
   */
  info(message: string, ...data: unknown[]): void {
    if (VISIBLE_LOG_LEVELS.includes('info')) {
      console.log(`${this.prefix}${message}`, ...data);
    }
  }

  /**
   * Log at warning level
   */
  warn(message: string, ...data: unknown[]): void {
    if (VISIBLE_LOG_LEVELS.includes('warn')) {
      console.warn(`${this.prefix}${message}`, ...data);
    }
  }

  /**
   * Log at error level
   */
  error(message: string, ...data: unknown[]): void {
    if (VISIBLE_LOG_LEVELS.includes('error')) {
      console.error(`${this.prefix}${message}`, ...data);
    }
  }

  /**
   * Create a performance logger to measure execution time
   */
  perf(operation: string): () => void {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      this.info(`${operation} completed in ${(endTime - startTime).toFixed(2)}ms`);
    };
  }
}

/**
 * Create a specialized image logger for debugging image loading
 */
export function createImageLogger() {
  return new Logger('IMAGE');
}

/**
 * Create a specialized performance logger for monitoring execution time
 */
export function createPerfLogger() {
  return new Logger('PERF');
}

/**
 * Default logger instance for general use
 */
// Create default logger instance
const defaultLogger = new Logger();
export default defaultLogger;
