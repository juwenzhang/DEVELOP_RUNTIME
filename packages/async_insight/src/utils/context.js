/**
 * 上下文的管理工具
 */
const crypto = require('crypto');
const DEFAULT_SPAN_ID_LENGTH = 16;

// 使用 Node.js 内置的 crypto 模块生成 UUID
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = crypto.randomBytes(1)[0] % 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

class ContextUtils {
    // 创建请求上下文
    static createRequestContext(req, res, serviceName) {
        const traceId = req.headers['x-trace-id'] || uuidv4();
        const spanId = req.headers['x-span-id'] || uuidv4().slice(0, DEFAULT_SPAN_ID_LENGTH);
        const parentSpanId = req.headers['x-parent-span-id'];

        // 构建上下文对象
        return {
            requestId: req.headers['x-request-id'] || uuidv4(),
            userId: req.headers['x-user-id'] || 'anonymous',
            traceId,
            spanId,
            parentSpanId,
            serviceName,
            timestamp: Date.now(),
            method: req.method,
            url: req.url,
            remoteAddress: req.ip
        };
    }

    // 上下文的深拷贝
    static deepCloneContext(context) {
        if (!context) {
            return {};
        }
        try {
            return JSON.parse(JSON.stringify(context));
        }
        catch (error) {
            const clonedContext = {};
            for (const key in context) {
                if (typeof context[key] === 'object' && context[key] !== null) {
                    clonedContext[key] = Array.isArray(context[key]) 
                        ? [...context[key]] 
                        : {...context[key]};
                } else {
                    clonedContext[key] = context[key];
                }
            }
            return clonedContext;
        }
    }

    // 实现生成 spanId
    static createChildSpanContext(context) {
        const clonedContext = this.deepCloneContext(context);
        clonedContext.parentSpanId = clonedContext.spanId;
        clonedContext.spanId = uuidv4().slice(0, DEFAULT_SPAN_ID_LENGTH);
        return clonedContext;
    }
}

module.exports = ContextUtils;
