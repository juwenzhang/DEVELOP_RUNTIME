import winston from 'winston';
import { format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const LOG_DIR = join(process.cwd(), 'logs');

const DIR_UTIL = {
    checkLogDirIsExist: (path: string): boolean => {
        return existsSync(path);
    },
    
    createLogDir: (path: string, options: { recursive?: boolean } = { recursive: true }): void => {
        if (!DIR_UTIL.checkLogDirIsExist(path)) {
            mkdirSync(path, options);
        }
    }
};

export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    HTTP = 'http',
    VERBOSE = 'verbose',
    DEBUG = 'debug',
    SILLY = 'silly'
}

export class Logger {
    private serverName: string;
    private Logger: winston.Logger;

    constructor(serverName: string = 'async_insight', level: LogLevel = LogLevel.INFO) {
        this.serverName = serverName;
        this.Logger = this.createLogger(level);
        DIR_UTIL.createLogDir(LOG_DIR);
    }

    private createLogger(level: LogLevel, _format: string = 'YYYY-MM-DD HH:mm:ss'): winston.Logger {
        // 控制台日志格式
        const consoleFormat = format.combine(
            format.colorize(),
            format.timestamp({
                format: _format
            }),
            format.printf(({
                timestamp, level, message, ...meta
            }) => {
                return `[${timestamp}] ${level}: ${message} ${Object.keys(meta).length
                    ? JSON.stringify(meta)
                    : ''
                }`;
            })
        );

        // 文件日志格式
        const fileFormat = format.combine(
            format.timestamp({
                format: _format
            }),
            format.json()
        );

        // 定义日志传输
        const logTransports = [
            new transports.Console({
                format: consoleFormat,
                level: level
            }),
            new DailyRotateFile({
                filename: `${LOG_DIR}/%DATE%.log`,
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxSize: '20m',
                maxFiles: '14d',
                format: fileFormat,
                level: level
            }),
            new DailyRotateFile({
                filename: `${LOG_DIR}/error/%DATE%.error.log`,
                datePattern: 'YYYY-MM-DD',
                zippedArchive: true,
                maxSize: '20m',
                maxFiles: '14d',
                format: fileFormat,
                level: LogLevel.ERROR
            })
        ];

        // 创建并返回logger实例
        return winston.createLogger({
            defaultMeta: {
                server: this.serverName
            },
            transports: logTransports
        });
    }

    setServerName(serverName: string): void {
        this.serverName = serverName;
        this.Logger.defaultMeta = {
            server: serverName
        };
    }

    info(message: string, meta?: Record<string, any>): void {
        this.Logger.info(message, meta);
    }

    error(message: string, meta?: Record<string, any>): void {
        this.Logger.error(message, meta);
    }

    warn(message: string, meta?: Record<string, any>): void {
        this.Logger.warn(message, meta);
    }

    debug(message: string, meta?: Record<string, any>): void {
        this.Logger.debug(message, meta);
    }
}

export default new Logger();
