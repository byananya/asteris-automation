// Simple console-based logger that works with ES modules
type LogLevel = 'info' | 'error' | 'warn' | 'debug';

const log = (level: LogLevel, message: string, ...meta: any[]) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  if (meta.length > 0) {
    console[level](logMessage, ...meta);
  } else {
    console[level](logMessage);
  }
};

export const logger = {
  info: (message: string, ...meta: any[]) => log('info', message, ...meta),
  error: (message: string, ...meta: any[]) => log('error', message, ...meta),
  warn: (message: string, ...meta: any[]) => log('warn', message, ...meta),
  debug: (message: string, ...meta: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      log('debug', message, ...meta);
    }
  }
};
