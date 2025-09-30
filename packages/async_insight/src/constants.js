/**
 * async_insight contants.js
 */

/**
 * 异步资源类型
 */
exports.ASYNC_RESOURCE_TYPES = {
    PROMISE: 'Promise',
    TIMEOUT: 'Timeout',
    INTERVAL: 'Interval',
    TCPWRAP: 'TCPWRAP',       // TCP 连接
    HTTPPARSER: 'HTTPPARSER', // HTTP 解析器
    FSREQWRAP: 'FSREQWRAP',   // 文件系统请求包装器
    SHUTDOWNWRAP: 'SHUTDOWNWRAP',
    WRITEWRAP: 'WRITEWRAP',
    GETADDRINFOREQWRAP: 'GETADDRINFOREQWRAP'
}

/**
 * 默认常量
 */
exports.DEFAULT_CONFIG = {
    ENABLE_METRICS: true,
    ENABLE_LEAK_DETECT: true,
    LEAK_DETECT_INTERVAL: 30000, // 30秒
    LEAK_THRESHOLD: 30000,       // 30秒未销毁视为泄漏
    SERVICE_NAME: 'unknown-service',
    MAX_EVENT_LISTENERS: 100     // 事件监听器上限
};

/**
 * 自定义事件常量
 */
exports.EVENTS = {
    RESOURCE_INIT: 'resource.init',
    RESOURCE_BEFORE: 'resource.before',
    RESOURCE_AFTER: 'resource.after',
    RESOURCE_DESTROY: 'resource.destroy',
    PROMISE_RESOLVE: 'promise.resolve',
    RESOURCE_LEAK: 'resource.leak'
};