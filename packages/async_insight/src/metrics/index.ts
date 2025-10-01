import { Counter, Histogram, register, collectDefaultMetrics } from 'prom-client';
import { DEFAULT_CONFIG } from '../constants';

// 清除默认存在的指标信息
register.clear();

/**
 * 定义指标对象类型
 */
export interface MetricsType {
    // 异步资源加载总数
    asyncResourceInitTotal: Counter<string>;
    // 异步资源执行耗时
    asyncResourceExecDuration: Histogram<string>;
    // 异步资源生命周期耗时
    asyncResourceLifecycleDuration: Histogram<string>;
    // 异步资源泄漏总数
    asyncResourceLeakTotal: Counter<string>;
    // 上下文传递次数
    asyncResourceContextPassTotal: Counter<string>;
    // 上下文传播总数
    contextPropagationTotal: Counter<string>;
}

/**
 * 指标对象，包含所有需要监控的指标
 */
export const metrics: MetricsType = {
    // 异步资源加载总数
    asyncResourceInitTotal: new Counter({
        name: 'async_resource_init_total',
        help: 'Total number of async resources initialized',
        labelNames: ['type', 'service_name']
    }),
    
    // 异步资源执行耗时
    asyncResourceExecDuration: new Histogram({
        name: 'async_resource_exec_duration_ms',
        help: 'Duration of async resource execution (from before to after hook)',
        labelNames: ['type', 'service_name'],
        buckets: [1, 5, 10, 25, 50, 100, 200, 500, 1000, 2000, 5000, 10000]
    }),

    // 异步资源生命周期耗时
    asyncResourceLifecycleDuration: new Histogram({
        name: 'async_resource_lifecycle_duration_ms',
        help: 'Duration of async resource lifecycle (from init to destroy)',
        labelNames: ['type', 'service_name'],
        buckets: [1, 5, 10, 25, 50, 100, 200, 500, 1000, 2000, 5000, 10000]
    }),

    // 异步资源泄漏总数
    asyncResourceLeakTotal: new Counter({
        name: 'async_resource_leak_total',
        help: 'Total number of async resources leaked',
        labelNames: ['type', 'service_name']
    }),

    // 上下文传递次数
    asyncResourceContextPassTotal: new Counter({
        name: 'async_resource_context_pass_total',
        help: 'Total number of async resources passed through context',
        labelNames: ['type', 'service_name']
    }),

    // 上下文传播总数
    contextPropagationTotal: new Counter({
        name: 'async_resource_context_propagation_total',
        help: 'Total number of async resources propagated through context',
        labelNames: ['type', 'service_name']
    })
};

/**
 * 初始化默认指标
 */
export function initMetrics(): void {
    collectDefaultMetrics({
        register,
        prefix: 'async_insight_',
        labels: {
            service_name: DEFAULT_CONFIG.SERVICE_NAME
        }
    });
}

export { register };
