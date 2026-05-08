type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogEntry = {
  level: LogLevel;
  message: string;
  timestamp: string;
  service: string;
  context?: Record<string, any>;
};

class Logger {
  private service: string;
  private isProduction: boolean;

  constructor(service: string) {
    this.service = service;
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private formatLog(entry: LogEntry): string {
    if (this.isProduction) {
      return JSON.stringify(entry);
    }
    const color = {
      debug: '\x1b[36m',
      info: '\x1b[32m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
    }[entry.level];
    const reset = '\x1b[0m';
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    return `${color}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp} [${entry.service}] ${entry.message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: this.service,
      context,
    };

    if (this.isProduction) {
      // Production: structured JSON logs
      const outputFn = {
        debug: console.debug,
        info: console.info,
        warn: console.warn,
        error: console.error,
      }[level];
      outputFn(this.formatLog(entry));
    } else {
      // Development: human-readable with colors
      const outputFn = {
        debug: console.debug,
        info: console.log,
        warn: console.warn,
        error: console.error,
      }[level];
      outputFn(this.formatLog(entry));
    }


  }

  debug(message: string, context?: Record<string, any>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, any>) {
    this.log('error', message, context);
  }
}

// Factory function for creating loggers
export function createLogger(service: string): Logger {
  return new Logger(service);
}

// Pre-configured loggers for common services
export const logger = {
  auth: createLogger('auth'),
  api: createLogger('api'),
  cms: createLogger('cms'),
  youtube: createLogger('youtube'),
  stripe: createLogger('stripe'),
  database: createLogger('database'),
  middleware: createLogger('middleware'),
};
