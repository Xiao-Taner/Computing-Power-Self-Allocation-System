const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

// 控制台颜色定义
const colors = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    // 基础颜色
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    magenta: '\x1b[35m',
    // 高亮颜色
    brightRed: '\x1b[91m',
    brightGreen: '\x1b[92m',
    brightMagenta: '\x1b[95m'
};

// 创建日志目录
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// 创建日志格式
const logFormat = winston.format.printf(({ timestamp, level, message, module, pid }) => {
    const icon = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
    const moduleInfo = module ? `[${module}]` : '';
    const processInfo = `[PID:${pid || process.pid}]`;
    
    // 控制台彩色输出
    if (this.console) {
        const color = level === 'error' ? colors.brightRed 
                   : level === 'warn' ? colors.yellow 
                   : colors.brightGreen;
        return `${colors.brightMagenta}${timestamp} ${colors.bold}${color}${icon}${moduleInfo}${processInfo}: ${message}${colors.reset}`;
    }
    
    // 文件普通输出
    return `${timestamp} ${icon}${moduleInfo}${processInfo}: ${message}`;
});

// 创建日志实例
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        logFormat
    ),
    transports: [
        // 控制台输出
        new winston.transports.Console({
            console: true
        }),
        // 按天切割的文件输出
        new winston.transports.DailyRotateFile({
            filename: path.join(logDir, '%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxFiles: '14d', // 保留14天的日志
            createSymlink: true,
            symlinkName: 'latest.log'
        })
    ]
});

// 扩展日志方法，支持模块名称
const enhancedLogger = {
    error: (message, module) => logger.error(message, { module }),
    warn: (message, module) => logger.warn(message, { module }),
    info: (message, module) => logger.info(message, { module }),
    http: (message, module) => logger.http(message, { module }),
    verbose: (message, module) => logger.verbose(message, { module }),
    debug: (message, module) => logger.debug(message, { module }),
    
    // 动态设置日志级别
    setLevel: (level) => {
        logger.level = level;
        return logger.level;
    },
    
    // 获取当前日志级别
    getLevel: () => logger.level
};

module.exports = enhancedLogger; 