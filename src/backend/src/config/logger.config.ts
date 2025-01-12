import winston, { format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Environment variables with defaults
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL;
const LOG_FILE_PATH = process.env.LOG_FILE_PATH || './logs';
const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || '20m';
const MAX_FILES = process.env.MAX_FILES || '14d';

/**
 * Determines appropriate log level based on environment and configuration
 * @returns {string} Winston log level
 */
const getLogLevel = (): string => {
    const allowedLevels = ['error', 'warn', 'info', 'debug'];
    
    if (LOG_LEVEL && allowedLevels.includes(LOG_LEVEL.toLowerCase())) {
        return LOG_LEVEL.toLowerCase();
    }
    
    return NODE_ENV === 'development' ? 'debug' : 'info';
};

/**
 * Creates Winston format configuration for structured logging with ELK Stack compatibility
 * @returns {winston.Logform.Format} Combined Winston format configuration
 */
const createLogFormat = (): winston.Logform.Format => {
    return format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS'
        }),
        format.metadata({
            fillWith: {
                service: 'identity-matrix',
                environment: NODE_ENV,
                version: process.env.npm_package_version
            }
        }),
        format.errors({ stack: true }),
        format.json(),
        format((info) => {
            info.requestId = global?.requestId;
            return info;
        })(),
        NODE_ENV === 'development' ? format.prettyPrint({
            colorize: true,
            depth: 4
        }) : format.json()
    );
};

/**
 * Logger configuration class with environment-specific settings and ELK Stack integration
 */
class LoggerConfig {
    public level: string;
    public format: winston.Logform.Format;
    public transports: winston.transport[];

    constructor() {
        this.level = getLogLevel();
        this.format = createLogFormat();
        this.transports = this.initializeTransports();
    }

    /**
     * Initializes Winston transports based on environment
     * @private
     * @returns {winston.transport[]} Configured transports array
     */
    private initializeTransports(): winston.transport[] {
        const transportArray: winston.transport[] = [];

        // Console transport for all environments
        transportArray.push(new transports.Console({
            level: this.level,
            handleExceptions: true,
            format: NODE_ENV === 'development' 
                ? format.combine(format.colorize(), format.simple())
                : format.json()
        }));

        // File transports for production environment
        if (NODE_ENV === 'production') {
            // Combined logs
            transportArray.push(new DailyRotateFile({
                filename: `${LOG_FILE_PATH}/combined-%DATE%.log`,
                datePattern: 'YYYY-MM-DD',
                maxSize: MAX_FILE_SIZE,
                maxFiles: MAX_FILES,
                level: this.level,
                format: format.json(),
                handleExceptions: true,
                zippedArchive: true,
                auditFile: `${LOG_FILE_PATH}/combined-audit.json`
            }));

            // Error logs
            transportArray.push(new DailyRotateFile({
                filename: `${LOG_FILE_PATH}/error-%DATE%.log`,
                datePattern: 'YYYY-MM-DD',
                maxSize: MAX_FILE_SIZE,
                maxFiles: MAX_FILES,
                level: 'error',
                format: format.json(),
                handleExceptions: true,
                zippedArchive: true,
                auditFile: `${LOG_FILE_PATH}/error-audit.json`
            }));

            // Security events logs
            transportArray.push(new DailyRotateFile({
                filename: `${LOG_FILE_PATH}/security-%DATE%.log`,
                datePattern: 'YYYY-MM-DD',
                maxSize: MAX_FILE_SIZE,
                maxFiles: MAX_FILES,
                level: 'warn',
                format: format.combine(
                    format.json(),
                    format((info) => {
                        if (info.security) {
                            info.securityEvent = true;
                            info.timestamp = new Date().toISOString();
                            info.securityLevel = info.level;
                        }
                        return info;
                    })()
                ),
                handleExceptions: true,
                zippedArchive: true,
                auditFile: `${LOG_FILE_PATH}/security-audit.json`
            }));
        }

        return transportArray;
    }
}

// Create and export logger configuration instance
const loggerConfig = new LoggerConfig();

export { loggerConfig };