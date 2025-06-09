const log = (level, message, ...meta) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    if (meta.length > 0) {
        console[level](logMessage, ...meta);
    }
    else {
        console[level](logMessage);
    }
};
export const logger = {
    info: (message, ...meta) => log('info', message, ...meta),
    error: (message, ...meta) => log('error', message, ...meta),
    warn: (message, ...meta) => log('warn', message, ...meta),
    debug: (message, ...meta) => {
        if (process.env.NODE_ENV !== 'production') {
            log('debug', message, ...meta);
        }
    }
};
