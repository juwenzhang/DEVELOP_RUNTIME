export enum ASYNC_RESOURCE_TYPES {
    PROMISE = 'Promise',
    TIMEOUT = 'Timeout',
    INTERVAL = 'Interval',
    TCPWRAP = 'TCPWRAP',
    HTTPPARSER = 'HTTPPARSER',
    FSREQWRAP = 'FSREQWRAP',
    SHUTDOWNWRAP = 'SHUTDOWNWRAP',
    WRITEWRAP = 'WRITEWRAP',
    GETADDRINFOREQWRAP = 'GETADDRINFOREQWRAP'
}

export const DEFAULT_CONFIG = {
    ENABLE_METRICS: true,
    ENABLE_LEAK_DETECT: true,
    LEAK_DETECT_INTERVAL: 30000, // 30秒
    LEAK_THRESHOLD: 30000,       // 30秒未销毁视为泄漏
    SERVICE_NAME: 'unknown-service',
    MAX_EVENT_LISTENERS: 100     // 事件监听器上限
} as const;

export enum EVENTS {
    RESOURCE_INIT = 'resource.init',
    RESOURCE_BEFORE = 'resource.before',
    RESOURCE_AFTER = 'resource.after',
    RESOURCE_DESTROY = 'resource.destroy',
    PROMISE_RESOLVE = 'promise.resolve',
    RESOURCE_LEAK = 'resource.leak'
}

export interface AsyncInsightOptions {
    serviceName?: string;
    enableMetrics?: boolean;
    enableResourceLeakDetect?: boolean;
    leakDetectInterval?: number;
    leakThreshold?: number;
    MAX_EVENT_LISTENERS?: number;
}

export interface ResourceInfo {
    id: number;
    type: string;
    triggerId: number;
    createdAt: number;
    destroyedAt?: number;
    duration?: number;
    data?: Record<string, any>;
}

export interface RequestContext {
    requestId: string;
    userId: string;
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    serviceName: string;
    timestamp: number;
    method: string;
    url: string;
    remoteAddress: string;
    [key: string]: any;
}
