import async_hooks from 'async_hooks';
import { AsyncLocalStorage } from 'async_hooks';
import EventEmitter from 'node:events';
import type { Request, Response, NextFunction } from 'express';
import { metrics, register, initMetrics } from './metrics/index';
import logger from './utils/logger';
import { ContextUtils } from './utils/context';
import { DEFAULT_CONFIG, EVENTS, AsyncInsightOptions, ResourceInfo, RequestContext } from './constants';
import { ExpressAdapter } from './adapters/express';
import { KoaAdapter } from './adapters/koa';
import { FastifyAdapter } from './adapters/fastify';

export class AsyncInsight {
    private static instance: AsyncInsight | null = null;
    private options: Required<AsyncInsightOptions>;
    private als: AsyncLocalStorage<Record<string, any>>;
    private hooks: async_hooks.AsyncHook | null;
    private resourceMap: Map<number, ResourceInfo>;
    private eventEmitter: EventEmitter;
    private leakDetectionInterval: NodeJS.Timeout | null = null;

    public static getInstance(options?: AsyncInsightOptions): AsyncInsight {
        if (!AsyncInsight.instance) {
            AsyncInsight.instance = new AsyncInsight(options);
        }
        return AsyncInsight.instance;
    }

    private constructor(options?: AsyncInsightOptions) {
        if (AsyncInsight.instance) {
            throw new Error('AsyncInsight is a singleton class');
        }

        this.options = {
            enableMetrics: process.env.ASYNC_INSIGHT_ENABLE_METRICS !== 'false' && DEFAULT_CONFIG.ENABLE_METRICS,
            enableResourceLeakDetect: process.env.ASYNC_INSIGHT_ENABLE_LEAK_DETECT !== 'false' && DEFAULT_CONFIG.ENABLE_LEAK_DETECT,
            leakDetectInterval: parseInt(process.env.ASYNC_INSIGHT_LEAK_INTERVAL || '') || DEFAULT_CONFIG.LEAK_DETECT_INTERVAL,
            leakThreshold: parseInt(process.env.ASYNC_INSIGHT_LEAK_THRESHOLD || '') || DEFAULT_CONFIG.LEAK_THRESHOLD,
            serviceName: process.env.SERVICE_NAME || DEFAULT_CONFIG.SERVICE_NAME,
            MAX_EVENT_LISTENERS: DEFAULT_CONFIG.MAX_EVENT_LISTENERS,
            ...options
        };

        this.als = new AsyncLocalStorage();
        this.hooks = null;
        this.resourceMap = new Map();
        this.eventEmitter = new EventEmitter();
        this.eventEmitter.setMaxListeners(this.options.MAX_EVENT_LISTENERS);

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
                enableResourceLeakDetect: this.options.enableResourceLeakDetect
            }
        });
    }

    private initHooks(): void {
        try {
            this.hooks = async_hooks.createHook({
                init: this.onInit.bind(this),
                before: this.onBefore.bind(this),
                after: this.onAfter.bind(this),
                destroy: this.onDestroy.bind(this),
                promiseResolve: this.onPromiseResolve.bind(this)
            });
            this.hooks.enable();
        } catch (error) {
            logger.error('Failed to initialize async hooks', { error: error instanceof Error ? error.message : String(error) });
        }
    }

    private initLeakDetection(): void {
        if (!this.options.enableResourceLeakDetect) {
            return;
        }

        this.leakDetectionInterval = setInterval(() => {
            this.checkForLeaks();
        }, this.options.leakDetectInterval);

        process.on('exit', () => {
            if (this.leakDetectionInterval) {
                clearInterval(this.leakDetectionInterval);
            }
        });
    }

    private checkForLeaks(): void {
        const now = Date.now();
        const leaks: ResourceInfo[] = [];

        this.resourceMap.forEach((resource, id) => {
            if (!resource.destroyedAt && now - resource.createdAt > this.options.leakThreshold) {
                leaks.push({
                    ...resource,
                    duration: now - resource.createdAt
                });
            }
        });

        if (leaks.length > 0) {
            logger.warn('Potential resource leaks detected', {
                count: leaks.length,
                examples: leaks.slice(0, 5)
            });

            this.eventEmitter.emit(EVENTS.RESOURCE_LEAK, leaks);

            if (this.options.enableMetrics) {
                leaks.forEach(leak => {
                    metrics.asyncResourceLeakTotal.inc({
                        type: leak.type,
                        service_name: this.options.serviceName
                    });
                });
            }
        }
    }

    private onInit(asyncId: number, type: string, triggerId: number, resource: any): void {
        const now = Date.now();
        const resourceInfo: ResourceInfo = {
            id: asyncId,
            type,
            triggerId,
            createdAt: now,
            data: resource
        };

        this.resourceMap.set(asyncId, resourceInfo);

        this.eventEmitter.emit(EVENTS.RESOURCE_INIT, resourceInfo);

        if (this.options.enableMetrics) {
            metrics.asyncResourceInitTotal.inc({
                type,
                service_name: this.options.serviceName
            });
        }
    }

    private onBefore(asyncId: number): void {
        const resourceInfo = this.resourceMap.get(asyncId);
        if (!resourceInfo) return;

        (resourceInfo as any).beforeTime = Date.now();

        this.eventEmitter.emit(EVENTS.RESOURCE_BEFORE, resourceInfo);
    }

    private onAfter(asyncId: number): void {
        const resourceInfo = this.resourceMap.get(asyncId);
        if (!resourceInfo) return;

        const beforeTime = (resourceInfo as any).beforeTime;
        if (beforeTime && this.options.enableMetrics) {
            const duration = Date.now() - beforeTime;
            metrics.asyncResourceExecDuration.observe({
                type: resourceInfo.type,
                service_name: this.options.serviceName
            }, duration);
        }

        this.eventEmitter.emit(EVENTS.RESOURCE_AFTER, resourceInfo);
    }

    private onDestroy(asyncId: number): void {
        const resourceInfo = this.resourceMap.get(asyncId);
        if (!resourceInfo) return;

        const now = Date.now();
        resourceInfo.destroyedAt = now;
        resourceInfo.duration = now - resourceInfo.createdAt;

        if (this.options.enableMetrics) {
            metrics.asyncResourceLifecycleDuration.observe({
                type: resourceInfo.type,
                service_name: this.options.serviceName
            }, resourceInfo.duration);
        }

        this.eventEmitter.emit(EVENTS.RESOURCE_DESTROY, resourceInfo);

        this.resourceMap.delete(asyncId);
    }

    private onPromiseResolve(asyncId: number): void {
        const resourceInfo = this.resourceMap.get(asyncId);
        if (!resourceInfo) return;

        this.eventEmitter.emit(EVENTS.PROMISE_RESOLVE, resourceInfo);
    }

    public configure(options: AsyncInsightOptions): void {
        this.options = {
            ...this.options,
            ...options
        };

        if (this.options.enableMetrics && options.serviceName) {
            register.setDefaultLabels({
                service_name: this.options.serviceName
            });
        }

        if (options.serviceName) {
            logger.setServerName(this.options.serviceName);
        }

        logger.info('AsyncInsight configured', { options });
    }

    public getContext<T extends Record<string, any>>(): T | undefined {
        return this.als.getStore() as T | undefined;
    }

    public runWithContext<T>(context: Record<string, any>, callback: () => T): T {
        return this.als.run(context, callback);
    }

    public on(event: string | symbol, listener: (...args: any[]) => void): this {
        this.eventEmitter.on(event, listener);
        return this;
    }

    public once(event: string | symbol, listener: (...args: any[]) => void): this {
        this.eventEmitter.once(event, listener);
        return this;
    }

    public off(event: string | symbol, listener: (...args: any[]) => void): this {
        this.eventEmitter.off(event, listener);
        return this;
    }

    public getResourceCount(): number {
        return this.resourceMap.size;
    }

    public getResourceInfo(): ResourceInfo[] {
        return Array.from(this.resourceMap.values());
    }

    public shutdown(): void {
        // 禁用异步钩子
        if (this.hooks) {
            this.hooks.disable();
            this.hooks = null;
        }

        // 清除泄漏检测定时器
        if (this.leakDetectionInterval) {
            clearInterval(this.leakDetectionInterval);
            this.leakDetectionInterval = null;
        }

        // 清空资源映射
        this.resourceMap.clear();

        // 移除所有事件监听器
        this.eventEmitter.removeAllListeners();

        logger.info('AsyncInsight shutdown successfully');
    }

    /**
     * 获取 Express 适配器实例
     * @returns ExpressAdapter 实例
     */
    public getExpressAdapter(): ExpressAdapter {
        return new ExpressAdapter(this);
    }

    /**
     * 获取 Koa 适配器实例
     * @returns KoaAdapter 实例
     */
    public getKoaAdapter(): KoaAdapter {
        return new KoaAdapter(this);
    }

    /**
     * 获取 Fastify 适配器实例
     * @returns FastifyAdapter 实例
     */
    public getFastifyAdapter(): FastifyAdapter {
        return new FastifyAdapter(this);
    }
}
