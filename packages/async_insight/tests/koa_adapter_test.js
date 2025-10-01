const Koa = require('koa');
const Router = require('@koa/router');
const asyncInsight = require('../dist/cjs/index').default;

// 初始化 AsyncInsight，禁用资源泄漏检测以避免循环引用错误
asyncInsight.configure({
    serviceName: 'koa-test-service',
    enableMetrics: true,
    enableResourceLeakDetect: false
});

// 创建 Koa 应用
const app = new Koa();
const router = new Router();

// 获取 Koa 适配器并注册中间件
const koaAdapter = asyncInsight.getKoaAdapter();
app.use(koaAdapter.middleware());

// 测试路由 - 基础上下文传递
router.get('/api/context', (ctx) => {
    // 从 AsyncInsight 获取当前上下文
    const context = asyncInsight.getContext();
    
    // 记录上下文信息到日志
    console.log('=== Basic Context Test ===');
    console.log('Request ID:', context?.requestId);
    console.log('Trace ID:', context?.traceId);
    console.log('Service Name:', context?.serviceName);
    console.log('Method:', context?.method);
    console.log('URL:', context?.url);
    console.log('========================');
    
    ctx.body = {
        message: 'Context retrieved successfully',
        context: {
            requestId: context?.requestId,
            traceId: context?.traceId,
            serviceName: context?.serviceName,
            method: context?.method,
            url: context?.url
        },
        headers: ctx.headers
    };
});

// 测试路由 - 异步操作中的上下文
router.get('/api/async', async (ctx) => {
    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 异步操作中获取上下文
    const context = asyncInsight.getContext();
    
    // 记录上下文信息到日志
    console.log('=== Async Operation Context Test ===');
    console.log('Trace ID:', context?.traceId);
    console.log('Timestamp:', context?.timestamp);
    console.log('Current Time:', Date.now());
    console.log('==============================');
    
    ctx.body = {
        message: 'Context preserved in async operation',
        traceId: context?.traceId,
        timestamp: context?.timestamp,
        currentTime: Date.now()
    };
});

// 测试路由 - 嵌套异步函数中的上下文
router.get('/api/nested', async (ctx) => {
    // 嵌套异步函数
    async function nestedAsyncFunction() {
        await new Promise(resolve => setTimeout(resolve, 50));
        const nestedContext = asyncInsight.getContext();
        
        // 记录嵌套函数中的上下文信息
        console.log('=== Nested Async Function Context ===');
        console.log('Nested Request ID:', nestedContext?.requestId);
        console.log('Nested Trace ID:', nestedContext?.traceId);
        console.log('Nested Span ID:', nestedContext?.spanId);
        console.log('=================================');
        
        return nestedContext;
    }
    
    // 调用嵌套异步函数
    const context = await nestedAsyncFunction();
    
    // 记录外部函数中的上下文信息
    console.log('=== Outer Async Function Context ===');
    console.log('Outer Request ID:', context?.requestId);
    console.log('Outer Trace ID:', context?.traceId);
    console.log('Outer Span ID:', context?.spanId);
    console.log('=================================');
    
    ctx.body = {
        message: 'Context preserved in nested async functions',
        context: {
            requestId: context?.requestId,
            traceId: context?.traceId,
            spanId: context?.spanId
        }
    };
});

// 指标路由 - 添加日志以验证功能
router.get('/metrics', (ctx, next) => {
    console.log('=== Metrics Endpoint Accessed ===');
    console.log('Metrics collection triggered');
    console.log('==============================');
    return koaAdapter.metricsMiddleware()(ctx, next);
});

// 注册路由
app.use(router.routes());
app.use(router.allowedMethods());

// 启动服务器
const PORT = 5001;
const server = app.listen(PORT, () => {
    console.log(`\n=== Koa Test Server Started ===`);
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Test endpoints:`);
    console.log(`- http://localhost:${PORT}/api/context - Basic context test`);
    console.log(`- http://localhost:${PORT}/api/async - Async operation context test`);
    console.log(`- http://localhost:${PORT}/api/nested - Nested async functions context test`);
    console.log(`- http://localhost:${PORT}/metrics - Metrics endpoint`);
    console.log(`==============================\n`);
});

process.on('SIGINT', () => {
    console.log('Shutting down Koa test server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// 自动化测试 - 在服务器启动后自动发送请求验证功能
setTimeout(() => {
    console.log('\n=== Starting Automated Tests ===');
    
    const http = require('http');
    const endpoints = [
        '/api/context',
        '/api/async',
        '/api/nested',
        '/metrics'
    ];
    
    // 为每个端点发送请求
    endpoints.forEach((endpoint, index) => {
        setTimeout(() => {
            console.log(`\nTesting endpoint: ${endpoint}`);
            
            const options = {
                hostname: 'localhost',
                port: PORT,
                path: endpoint,
                method: 'GET'
            };
            
            const req = http.request(options, (res) => {
                console.log(`Status Code: ${res.statusCode}`);
                console.log('Response Headers:', res.headers);
                
                res.on('data', (chunk) => {
                    try {
                        const data = JSON.parse(chunk.toString());
                        console.log('Response Body (parsed):', JSON.stringify(data, null, 2));
                    } catch (e) {
                        console.log('Response Body:', chunk.toString());
                    }
                });
            });
            
            req.on('error', (e) => {
                console.error(`Error testing ${endpoint}:`, e.message);
            });
            
            req.end();
        }, index * 1000); 
    });
    
    // 测试完成后关闭服务器
    setTimeout(() => {
        console.log('\n=== All Tests Completed ===');
        console.log('Shutting down Koa test server...');
        server.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    }, (endpoints.length + 2) * 1000);
}, 2000); 
