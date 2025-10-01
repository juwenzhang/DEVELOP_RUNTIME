import type { FastifyPluginCallback, FastifyInstance, FastifyRequest, FastifyReply, FastifyPluginOptions } from 'fastify';
import type { AsyncInsight } from '../AsyncInsight';
import { ContextUtils } from '../utils/context';

/**
 * Fastify 适配器
 * 提供 Fastify 框架的中间件集成
 */
export class FastifyAdapter {
    private asyncInsight: AsyncInsight;

    constructor(asyncInsight: AsyncInsight) {
        this.asyncInsight = asyncInsight;
    }

    /**
     * 创建 Fastify 插件
     * @returns Fastify 插件回调函数
     */
    public plugin(): FastifyPluginCallback {
        return (fastify: FastifyInstance, options: FastifyPluginOptions, done: (err?: Error) => void) => {
            // 注册请求上下文中间件
            fastify.addHook('onRequest', (request: FastifyRequest, reply: FastifyReply, next: (err?: Error) => void) => {
                const context = ContextUtils.createRequestContext(
                    request,
                    this.asyncInsight['options'].serviceName,
                    reply
                );

                this.asyncInsight.runWithContext(context, () => {
                    reply.header('x-trace-id', context.traceId);
                    next();
                });
            });

            // 注册指标路由
            fastify.get('/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
                const { register } = await import('../metrics/index');
                try {
                    reply.header('Content-Type', register.contentType);
                    reply.send(await register.metrics());
                } catch (error) {
                    reply.status(500).send(error instanceof Error ? error.message : String(error));
                }
            });

            done();
        };
    }
}
