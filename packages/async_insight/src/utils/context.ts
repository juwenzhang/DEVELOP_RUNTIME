import crypto from 'crypto';
import type { RequestContext } from '../constants';

const DEFAULT_SPAN_ID_LENGTH = 16;

export function uuidv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = crypto.randomBytes(1)[0] % 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// 定义通用的请求对象接口
interface GenericRequest {
    headers: Record<string, string | string[] | undefined>;
    method: string;
    url: string;
    ip?: string;
    socket?: { remoteAddress?: string };
    raw?: any;
}

export class ContextUtils {
    /**
     * 创建请求上下文（兼容所有框架）
     */
    static createRequestContext(req: GenericRequest, serviceName: string, res?: any): RequestContext {
        const traceId = req.headers['x-trace-id'] as string || uuidv4();
        const spanId = (req.headers['x-span-id'] as string || uuidv4()).slice(0, DEFAULT_SPAN_ID_LENGTH);
        const parentSpanId = req.headers['x-parent-span-id'] as string | undefined;

        return {
            requestId: (req.headers['x-request-id'] as string || uuidv4()),
            userId: (req.headers['x-user-id'] as string || 'anonymous'),
            traceId,
            spanId,
            parentSpanId,
            serviceName,
            timestamp: Date.now(),
            method: req.method,
            url: req.url,
            remoteAddress: req.ip || req.socket?.remoteAddress || ''
        };
    }

    /**
     * Express 特定的上下文创建方法（保持向后兼容性）
     */
    static createExpressContext(req: GenericRequest, res: any, serviceName: string): RequestContext {
        return this.createRequestContext(req, serviceName, res);
    }

    static deepCloneContext<T extends Record<string, any>>(context?: T): Record<string, any> {
        if (!context) {
            return {};
        }
        try {
            return JSON.parse(JSON.stringify(context));
        } catch (error) {
            const clonedContext: Record<string, any> = {};
            for (const key in context) {
                if (Object.prototype.hasOwnProperty.call(context, key)) {
                    if (typeof context[key] === 'object' && context[key] !== null) {
                        clonedContext[key] = Array.isArray(context[key])
                            ? context[key].map((item: any) => this.deepCloneContext(item))
                            : this.deepCloneContext(context[key]);
                    } else {
                        clonedContext[key] = context[key];
                    }
                }
            }
            return clonedContext;
        }
    }
}
