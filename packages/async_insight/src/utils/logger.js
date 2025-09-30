/**
 * 日志工具类
 * 核心使用第三方模块，log记录模块是 winston 的使用吧，对标的是 java 日志记录库：log4js
 * 日志格式是 json 格式，
 * 日志文件默认存储在项目根目录下的 logs 文件夹中，

 * 日志文件默认等级为 info，
 * 日志文件默认格式为 YYYY-MM-DD HH:mm:ss
 */
const winston = require('winston');
const { format, transports } = winston;
const DailyRotateFile = require('winston-daily-rotate-file');
const { existsSync, mkdirSync } = require('fs');
const { join } = require('path');
const LOG_DIR = join(process.cwd(), 'logs');

const DIR_UTILD = {
    checkLogDirIsExist: (path) => {
        return existsSync(path);
    },
    createLogDir: (path, options = { recursive: true }) => {
        if (!DIR_UTILD.checkLogDirIsExist(path)) {
            mkdirSync(path, ...options);
        }
    }
}

class Logger {
    constructor(serverName = 'async_insight', level = 'info') {
        this.serverName = serverName;
        this.Logger = this.createLogger(level);
        DIR_UTILD.createLogDir(LOG_DIR);
    }

    createLogger(level, _format = 'YYYY-MM-DD HH:mm:ss') {
        // 控制台日志格式
        const consoleFormat= format.combine(
            format.colorize(),
            format.timestamp({
                format: _format
            }),
            format.printf(({
                timestamp, level, message, ...meta
            }) => {
                return `[
                    ${timestamp}] ${level}: ${message} ${Object.keys(meta).length 
                        ? JSON.stringify(meta) 
                        : ''
                    }
                `;
            })
        );
        // 文件日志格式
        const fileFormat = format.combine(
            format.colorize(),
            format.json()  // 
            // 日志进行默认的格式化处理 ELK｜EFK
            // Elasticsearch, 
            // Logstash, 
            // Kibana
            // 进行分析报告吧
        );
        // 构建最终的日志配置
        const loggerConfig = {
            level: level,
            defaultMeta: { 
                serverName: this.serverName 
            },
            // 默认的日志格式
            format: fileFormat,
            /**
             * 对于winston的transport 等级有
             * 1. Console
             * 2. File
             * 3. HTTP
             * 4. MongoDB
             * 5. MySQL
             * 6. PostgreSQL
             * 7. Redis
             * 8. SMTP
             * 9. Syslog
             */
            transports: [
                // 控制台输出transport 通道
                new transports.Console({
                    format: consoleFormat
                }),
                // 文件输出transport 通道
                new transports.File({
                    filename: join(LOG_DIR, 'error.log'),
                    level: 'error',
                    maxsize: 1024 * 1024 * 10, // 10MB
                    maxFiles: 5,
                }),
                // 全量
                new DailyRotateFile({
                    filename: join(LOG_DIR, 'app-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '10m',
                    maxFiles: '14d'
                })
            ]
        };
        return winston.createLogger(loggerConfig);
    }

    _wrapLogMethod(method, message, meta = {}) {
        // 记录从 asyncLocalStorage 中获取得到异步信息
        let context = {}
        try {
            const { AsyncInsight } = require('../AsyncInsight.js');
            const instance = AsyncInsight.getInstance();
            if (instance && instance.als) {
                context = instance.als.getStore() || {};
            }
        }
        catch (_) {}
        return this.Logger[method](message, {
            ...context,
            ...meta
        });
    }

    error(message, meta) {
        return this._wrapLogMethod('error', message, meta);
    }

    warn(message, meta) {
        return this._wrapLogMethod('warn', message, meta);
    }

    info(message, meta) {
        return this._wrapLogMethod('info', message, meta);
    }

    debug(message, meta) {
        return this._wrapLogMethod('debug', message, meta);
    }

    setServerName(serverName) {
        this.serverName = serverName;
        this.Logger.defaultMeta.service = serverName;
    }

    getServerName() {
        return this.serverName;
    }

    setLevel(level) {
        this.Logger.level = level;
    }

    getLevel() {
        return this.Logger.level;
    }
}

module.exports = new Logger();
