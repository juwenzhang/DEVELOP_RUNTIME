const async_hooks = require('node:async_hooks');
const { AsyncLocalStorage } = async_hooks;
const EventEmitter = require('node:events');
const { metrics, register, initMetrics } = require('./metrics/index');
const logger = require('./utils/logger');
const ContextUtils = require('./utils/context');
const { DEFAULT_CONFIG, EVENTS } = require('./constants');

class AsyncInsight {
    static #instance = null;

    static getInstance(options) {
        if (!AsyncInsight.#instance) {
            AsyncInsight.#instance = new AsyncInsight(options);
        }
        return AsyncInsight.#instance;
    }

    constructor(options) {
        if (AsyncInsight.#instance) {
            throw new Error('AsyncInsight is a singleton class');
        }
        this.options = {
            enableMetrics: process.env.ASYNC_INSIGHT_ENABLE_METRICS !== 'false' && DEFAULT_CONFIG.ENABLE_METRICS,
            enableResourceLeakDetect: process.env.ASYNC_INSIGHT_ENABLE_LEAK_DETECT !== 'false' && DEFAULT_CONFIG.ENABLE_LEAK_DETECT,
            leakDetectInterval: parseInt(process.env.ASYNC_INSIGHT_LEAK_INTERVAL) || DEFAULT_CONFIG.LEAK_DETECT_INTERVAL,
            leakThreshold: parseInt(process.env.ASYNC_INSIGHT_LEAK_THRESHOLD) || DEFAULT_CONFIG.LEAK_THRESHOLD,
            serviceName: process.env.SERVICE_NAME || DEFAULT_CONFIG.SERVICE_NAME,
            ...options
        }
        this.als = new AsyncLocalStorage();
        this.hooks = null;
        this.resourceMap = new Map();
        this.eventEmitter = new EventEmitter();
        this.eventEmitter.setMaxListeners(this.options.MAX_EVENT_LISTENERS || DEFAULT_CONFIG.MAX_EVENT_LISTENERS);
        if (this.options.enableMetrics) {
            initMetrics();
            register.setDefaultLabels({
                service_name: this.options.serviceName
            });
        }
        this.initHooks();
        this.initLeakDetection();

        logger.setServerName(this.options.serviceName);

        logger.info('AsyncInsight initialized successfully', {
            serviceName: this.options.serviceName,
            config: {
                enableMetrics: this.options.enableMetrics,
                enableResourceLeakDetect: this.options.enableResourceLeakDetect,
                leakDetectInterval: this.options.leakDetectInterval,
                leakThreshold: this.options.leakThreshold,
            }
        });
    }

    initHooks() {
        this.hooks = async_hooks.createHook({
            init: this.#onInit.bind(this),
            before: this.#onBefore.bind(this),
            after: this.#onAfter.bind(this),
            destroy: this.#onDestroy.bind(this),
            promiseResolve: this.#onPromiseResolve.bind(this),
        });
        this.hooks.enable();
    }

    initLeakDetection() {
        if (this.options.enableResourceLeakDetect) {
            this.leakDetectionInterval = setInterval(
                () => this.detectResourceLeaks(), 
                this.options.leakDetectInterval
            );
            this.leakDetectionInterval.unref();

            process.on('exit', () => {
                this.cleanup();
            });
            process.on('SIGINT', () => {
                this.cleanup();
            });
            process.on('SIGTERM', () => {
                this.cleanup();
            });
        }
    }

    #onInit(asyncId, type, triggerAsyncId, resource) {
        try {
            const parentContext = this.als.getStore() || this.#getParentContext(triggerAsyncId);
            const context = ContextUtils.deepCloneContext(parentContext);

            // 资源信息
            const resourceInfo = {
                asyncId,
                type,
                triggerAsyncId,
                createTime: Date.now(),
                context,
                isDestroyed: false,
                serviceName: this.options.serviceName
            };

            this.resourceMap.set(asyncId, resourceInfo);
            this.eventEmitter.emit(EVENTS.RESOURCE_INIT, resourceInfo);

            // record metrics
            if (this.options.enableMetrics) {
                metrics.asyncResourceInitTotal.inc({
                    type,
                    service_name: this.options.serviceName
                })
            }
            logger.debug('Async resource initialized', {
                asyncId,
                type,
                triggerAsyncId,
                serviceName: this.options.serviceName
            });
        }
        catch (error) {
            logger.error('Error initializing async resource', {
                error: error.message,
                stack: error.stack,
                asyncId,
                type,
                triggerAsyncId,
                serviceName: this.options.serviceName
            });
        }
    }

    #onBefore(asyncId) {
        try {
            const resourceInfo = this.resourceMap.get(asyncId);
            if (!resourceInfo) {
                return;
            }

            // record current time
            resourceInfo.beforeTime = Date.now();
            // restart context
            if (resourceInfo.context) {
                this.als.enterWith(resourceInfo.context);
                if (this.options.enableMetrics) {
                    metrics.contextPropagationTotal.inc({
                        type: resourceInfo.type,
                        service_name: this.options.serviceName
                    });
                }
                logger.debug('Async resource context propagated', {
                    asyncId,
                    type: resourceInfo.type,
                    serviceName: this.options.serviceName
                });
            }
            this.eventEmitter.emit(EVENTS.RESOURCE_BEFORE, resourceInfo);
        }
        catch (error) {
            logger.error('Error propagating async resource context', {
                error: error.message,
                stack: error.stack,
                asyncId,
                type: resourceInfo.type,
                serviceName: this.options.serviceName
            });
        }
    }

    #onAfter(asyncId) {
        try {
            const resourceInfo = this.resourceMap.get(asyncId);
            if (!resourceInfo || !resourceInfo.beforeTime) {
                return;
            }
            const duration = Date.now() - resourceInfo.beforeTime;
            resourceInfo.duration = duration;

            this.eventEmitter.emit(EVENTS.RESOURCE_AFTER, resourceInfo);
            // record metrics
            if (this.options.enableMetrics) {
                metrics.asyncResourceContextPassTotal.inc({
                    type: resourceInfo.type,
                    service_name: this.options.serviceName
                });
            }
            logger.debug('Async resource context passed', {
                asyncId,
                type: resourceInfo.type,
                duration,
                serviceName: this.options.serviceName
            });
        }
        catch (error) {
            logger.error('Error after async resource', {
                error: error.message,
                stack: error.stack,
                asyncId,
                type: resourceInfo.type,
                serviceName: this.options.serviceName
            });
        }
    }

    #onDestroy(asyncId) {
        try {
            const resourceInfo = this.resourceMap.get(asyncId);
            if (!resourceInfo || resourceInfo.isDestroyed) {
                return;
            }
            resourceInfo.isDestroyed = true;
            resourceInfo.destroyTime = Date.now();
            const lifecycle = resourceInfo.destroyTime - resourceInfo.createTime;
            this.eventEmitter.emit(EVENTS.RESOURCE_DESTROY, resourceInfo);
            // record metrics
            if (this.options.enableMetrics) {
                metrics.asyncResourceLifecycleDuration.inc({
                    type: resourceInfo.type,
                    service_name: this.options.serviceName
                });
            }
            this.resourceMap.delete(asyncId);
            logger.debug('Async resource destroyed', {
                asyncId,
                type: resourceInfo.type,
                lifecycle,
                serviceName: this.options.serviceName
            });
        }
        catch (error) {
            logger.error('Error destroying async resource', {
                error: error.message,
                stack: error.stack,
                asyncId,
                type: resourceInfo.type,
                serviceName: this.options.serviceName
            });
        }
    }

    #onPromiseResolve(asyncId) {
        try {
            const resourceInfo = this.resourceMap.get(asyncId);
            if (resourceInfo) {
                this.eventEmitter.emit(EVENTS.PROMISE_RESOLVE, resourceInfo);
                logger.debug('Promise resolved', { asyncId });
            }
        } catch (error) {
            logger.error('Failed to handle promise resolve', { error: error.message, asyncId });
        }
    }
    
    #getParentContext(triggerAsyncId) {
        if (triggerAsyncId === 0) {
            return null;
        }
        const parentResource = this.resourceMap.get(triggerAsyncId);
        return parentResource ? parentResource.context : null;
    }

    detectResourceLeaks() {
        if (!this.options.enableResourceLeakDetect) {
            return;
        }
        const now = Date.now();
        const leaks = [];

        for (const [asyncId, info] of this.resourceMap.entries()) {
            if (!info.isDestroyed) {
                const age = now - info.createTime;
                if (age > this.options.leakThreshold) {
                    const leakInfo = {
                        ...info,
                        age
                    }
                    leaks.push(leakInfo);

                    if (this.options.enableMetrics) {
                        metrics.asyncResourceLeakTotal.inc({
                            type: info.type,
                            service_name: this.options.serviceName,
                            asyncId
                        });
                    }
                }
            }
        }

        if (leaks.length > 0) {
            this.eventEmitter.emit(EVENTS.RESOURCE_LEAK, leaks);
            logger.warn(`Detected ${leaks.length} potential resource leaks`, {
                leakCount: leaks.length,
                sample: leaks.slice(0, 5).map(
                    l => ({ 
                        asyncId: l.asyncId, 
                        type: l.type, 
                        age: l.age 
                    })
                )
            });
        }
    }

    cleanup() {
        logger.info('AsyncInsight cleanup');
        if (this.hooks) {
            this.hooks.disable();
        }
        if (this.leakDetectionInterval) {
            clearInterval(this.leakDetectionInterval);
        }
        this.resourceMap.clear();
    }

    enable() {
        if (this.hooks) {
            this.hooks.enable();
            logger.info('AsyncInsight hooks enabled');
        }
        return this;
    }

    disable() {
        if (this.hooks) {
            this.hooks.disable();
            logger.info('AsyncInsight hooks disabled');
        }
        return this;
    }

    runWithContext(context, fn) {
        if (typeof fn !== 'function') {
            throw new Error('fn must be a function');
        }
        const clonedContext = ContextUtils.deepCloneContext(context);
        return this.als.run(clonedContext, fn);
    }

    createRequestContext(req, res) {
        const context = ContextUtils.createRequestContext(req, res, this.options.serviceName);
        res.setHeader('X-Request-Id', context.requestId);
        res.setHeader('X-Trace-Id', context.traceId);

        const middleware = next => {
            if (typeof next !== 'function') {
                throw new Error('next must be a function');
            }
            return this.runWithContext(context, next);
        }

        return {
            context,
            middleware
        }
    }

    on(event, listener) {
        if (typeof event !== 'string') {
            throw new Error('event must be a string');
        }
        if (typeof listener !== 'function') {
            throw new Error('listener must be a function');
        }
        this.eventEmitter.on(event, listener);
        return this;
    }

    off(event, listener) {
        if (typeof event !== 'string') {
            throw new Error('event must be a string');
        }
        if (typeof listener !== 'function') {
            throw new Error('listener must be a function');
        }
        this.eventEmitter.off(event, listener);
        return this;
    }

    async getMetrics() {
        if (!this.options.enableMetrics) {
            return {};
        }
        return register.metrics();
    }
}

module.exports = {
    AsyncInsight
};
