/**
 * 自定义指标实现: prom-client 进行的使用吧, 对标的是 java 指标记录库：micrometer
 */
const { Counter, Histogram, register } = require('prom-client');
const { DEFAULT_CONFIG } = require('../constants');

// 首先进行清除默认存在的指标信息
(() => {
    register.clear();
})()

// 开始设计指标
const metrics = {
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

    //上下文传递次数
    asyncResourceContextPassTotal: new Counter({
        name: 'async_resource_context_pass_total',
        help: 'Total number of async resources passed through context',
        labelNames: ['type', 'service_name']
    }),

    contextPropagationTotal: new Counter({
        name: 'async_resource_context_propagation_total',
        help: 'Total number of async resources propagated through context',
        labelNames: ['type', 'service_name']
    }),
}   

function initMetrics() {
    const { collectDefaultMetrics } = require('prom-client');
    collectDefaultMetrics({
        register,
        prefix: 'async_insight_',
        labels: {
            service_name: DEFAULT_CONFIG.SERVICE_NAME
        }
    })
}

module.exports = {
    metrics,
    register,
    initMetrics
}
