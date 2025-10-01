const express = require('express');
const { AsyncInsight } = require('../dist/cjs/index');

// 初始化 AsyncInsight
const asyncInsight = AsyncInsight.getInstance({
    serviceName: 'express-test-service',
    enableMetrics: true
});

// 创建Express应用
const app = express();
const port = 5000;

// 获取Express适配器
const expressAdapter = asyncInsight.getExpressAdapter();

// 使用AsyncInsight中间件
app.use(expressAdapter.middleware());

// 测试路由 - 验证上下文传递
app.get('/api/context', (req, res) => {
    const context = asyncInsight.getContext();
    console.log('请求上下文:', context);
    
    res.json({
        success: true,
        message: '上下文传递测试',
        context: {
            requestId: context.requestId,
            traceId: context.traceId,
            userId: context.userId,
            serviceName: context.serviceName,
            method: context.method,
            url: context.url
        },
        headers: {
            'x-trace-id': res.getHeader('x-trace-id')
        }
    });
});

// 测试路由 - 异步操作中的上下文传递
app.get('/api/async', async (req, res) => {
    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 在异步操作后获取上下文
    const context = asyncInsight.getContext();
    
    res.json({
        success: true,
        message: '异步操作中的上下文传递',
        traceId: context.traceId,
        timestamp: Date.now()
    });
});

// 测试路由 - 嵌套异步函数中的上下文传递
app.get('/api/nested', async (req, res) => {
    const result = await nestedAsyncFunction();
    res.json(result);
});

// 嵌套异步函数
async function nestedAsyncFunction() {
    await new Promise(resolve => setTimeout(resolve, 100));
    const context = asyncInsight.getContext();
    
    return {
        success: true,
        message: '嵌套异步函数中的上下文',
        traceId: context.traceId,
        requestId: context.requestId
    };
}

// 使用指标中间件
app.get('/metrics', expressAdapter.metricsMiddleware());

// 启动服务器
const server = app.listen(port, () => {
    console.log(`\n=== Express 适配器测试 ===`);
    console.log(`AsyncInsight Express 测试服务器启动在 http://localhost:${port}`);
    console.log(`测试端点:`);
    console.log(`- GET /api/context - 测试基本上下文传递`);
    console.log(`- GET /api/async - 测试异步操作中的上下文`);
    console.log(`- GET /api/nested - 测试嵌套异步函数中的上下文`);
    console.log(`- GET /metrics - 查看指标数据`);
    console.log(`\n测试完成后按 Ctrl+C 停止服务器...`);
});

// 捕获终止信号
process.on('SIGINT', () => {
    console.log('\n正在关闭服务器和 AsyncInsight...');
    server.close(() => {
        asyncInsight.shutdown();
        console.log('服务器和 AsyncInsight 已成功关闭！');
        process.exit(0);
    });
});

// 自动化测试
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
                port: port,
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
    
    setTimeout(() => {
        console.log('\n=== All Tests Completed ===');
        console.log('正在关闭服务器和 AsyncInsight...');
        server.close(() => {
            asyncInsight.shutdown();
            console.log('服务器和 AsyncInsight 已成功关闭！');
            process.exit(0);
        });
    }, (endpoints.length + 2) * 1000);
}, 2000);
