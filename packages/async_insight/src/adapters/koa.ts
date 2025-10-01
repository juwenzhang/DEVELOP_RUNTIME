import type { Middleware } from 'koa';
import type { AsyncInsight } from '../AsyncInsight';
import { ContextUtils } from '../utils/context';

/**
 * Koa 适配器
 * 提供 Koa 框架的中间件集成
 */
export class KoaAdapter {
    private asyncInsight: AsyncInsight;

    constructor(asyncInsight: AsyncInsight) {
        this.asyncInsight = asyncInsight;
    }

    /**
     * 创建 Koa 中间件
     * @returns Koa 中间件函数
     */
    public middleware(): Middleware {
        return async (ctx, next) => {
            const context = ContextUtils.createRequestContext(
                {
                    headers: ctx.headers,
                    method: ctx.method,
                    url: ctx.url,
                    ip: ctx.ip,
                    socket: ctx.req.socket
                },
                this.asyncInsight['options'].serviceName,
                ctx.res
            );

            return this.asyncInsight.runWithContext(context, async () => {
                ctx.set('x-trace-id', context.traceId);
                await next();
            });
        };
    }

    /**
     * 创建指标暴露中间件
     * @returns Koa 中间件函数
     */
    public metricsMiddleware(): Middleware {
        return async (ctx) => {
            const { register } = await import('../metrics/index');
            try {
                ctx.set('Content-Type', register.contentType);
                ctx.body = await register.metrics();
            } catch (error) {
                ctx.status = 500;
                ctx.body = error instanceof Error ? error.message : String(error);
            }
        };
    }
}
