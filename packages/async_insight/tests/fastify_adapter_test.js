const fastify = require('fastify')();
const asyncInsight = require('../dist/cjs/index').default;

// 初始化 AsyncInsight，禁用资源泄漏检测以避免循环引用错误
asyncInsight.configure({
    serviceName: 'fastify-test-service',
    enableMetrics: true,
    enableResourceLeakDetect: false
});

// 注册 Fastify 插件
const fastifyAdapter = asyncInsight.getFastifyAdapter();
fastify.register(fastifyAdapter.plugin());

// 测试路由 - 基础上下文传递
fastify.get('/api/context', (request, reply) => {
    // 从 AsyncInsight 获取当前上下文
    const context = asyncInsight.getContext();
    reply.send({
        message: 'Context retrieved successfully',
        context: {
            requestId: context?.requestId,
            traceId: context?.traceId,
            serviceName: context?.serviceName,
            method: context?.method,
            url: context?.url
        },
        headers: request.headers
    });
});

// 测试路由 - 异步操作中的上下文
fastify.get('/api/async', async (request, reply) => {
    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 异步操作中获取上下文
    const context = asyncInsight.getContext();
    reply.send({
        message: 'Context preserved in async operation',
        traceId: context?.traceId,
        timestamp: context?.timestamp,
        currentTime: Date.now()
    });
});

// 测试路由 - 嵌套异步函数中的上下文
fastify.get('/api/nested', async (request, reply) => {
    // 嵌套异步函数
    async function nestedAsyncFunction() {
        await new Promise(resolve => setTimeout(resolve, 50));
        return asyncInsight.getContext();
    }
    
    // 调用嵌套异步函数
    const context = await nestedAsyncFunction();
    reply.send({
        message: 'Context preserved in nested async functions',
        context: {
            requestId: context?.requestId,
            traceId: context?.traceId,
            spanId: context?.spanId
        }
    });
});

const PORT = 5002;

process.on('SIGINT', () => {
    console.log('Shutting down Fastify test server...');
    fastify.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// 自动化测试 - 在服务器启动后自动发送请求验证功能
const startTests = () => {
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
                hostname: '127.0.0.1',
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
        console.log('Shutting down Fastify test server...');
        fastify.close(() => {
            console.log('Server closed');
            process.exit(0);
        });
    }, (endpoints.length + 2) * 1000);
};

const startServer = async () => {
    try {
        // 明确指定主机和端口
        await fastify.listen({ port: PORT, host: '0.0.0.0' });
        
        console.log(`\n=== Fastify Test Server Started ===`);
        console.log(`Server running on http://127.0.0.1:${PORT}`);
        console.log(`Test endpoints:`);
        console.log(`- http://127.0.0.1:${PORT}/api/context - Basic context test`);
        console.log(`- http://127.0.0.1:${PORT}/api/async - Async operation context test`);
        console.log(`- http://127.0.0.1:${PORT}/api/nested - Nested async functions context test`);
        console.log(`- http://127.0.0.1:${PORT}/metrics - Metrics endpoint`);
        console.log(`==============================\n`);
        console.log('Using IPv4 address 127.0.0.1 to avoid IPv6 resolution issues');
        
        // 服务器启动成功后立即执行测试，不需要等待
        setTimeout(startTests, 500);
        
    } catch (err) {
        console.error('Server failed to start:', err);
        process.exit(1);
    }
};

// 启动服务器
startServer();
