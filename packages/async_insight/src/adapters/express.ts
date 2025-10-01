import type { AsyncInsight } from '../AsyncInsight';
import { ContextUtils } from '../utils/context';
import type { Request, Response, NextFunction } from 'express';

/**
 * Express 适配器
 * 提供 Express 框架的中间件集成
 */
export class ExpressAdapter {
    private asyncInsight: AsyncInsight;

    constructor(asyncInsight: AsyncInsight) {
        this.asyncInsight = asyncInsight;
    }

    /**
     * 创建 Express 中间件
     * @returns Express 中间件函数
     */
    public middleware() {
        return (req: Request, res: Response, next: NextFunction) => {
            const context = ContextUtils.createRequestContext(
                req,
                this.asyncInsight['options'].serviceName,
                res
            );

            this.asyncInsight.runWithContext(context, () => {
                res.setHeader('x-trace-id', context.traceId);
                next();
            });
        };
    }

    /**
     * 创建指标暴露中间件
     * @returns Express 中间件函数
     */
    public metricsMiddleware() {
        return async (req: Request, res: Response) => {
            const { register } = await import('../metrics/index');
            try {
                res.set('Content-Type', register.contentType);
                res.end(await register.metrics());
            } catch (error) {
                res.status(500).end(error instanceof Error ? error.message : String(error));
            }
        };
    }
}
