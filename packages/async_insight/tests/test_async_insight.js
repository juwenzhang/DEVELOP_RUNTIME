const { AsyncInsight } = require('../dist/cjs/index');

// 初始化 AsyncInsight
const asyncInsight = AsyncInsight.getInstance({
    serviceName: 'test-service',
    enableMetrics: true,
    enableResourceLeakDetect: true,
    leakDetectInterval: 5000,
    leakThreshold: 5000
});

// 1. 基础上下文传递演示
async function basicContextDemo() {
    console.log('=== 基础上下文传递示例 ===');
    await asyncInsight.runWithContext({ userId: 'user_123', traceId: 'trace_456' }, async () => {
        console.log('同步代码上下文:', asyncInsight.getContext());
        await Promise.resolve().then(() => {
            console.log('Promise上下文:', asyncInsight.getContext());
        });
    });
}

// 2. 嵌套上下文演示
async function nestedContextDemo() {
    console.log('\n=== 嵌套上下文示例 ===');
    await asyncInsight.runWithContext({ level: 1 }, async () => {
        console.log('外层上下文:', asyncInsight.getContext());
        await asyncInsight.runWithContext({ level: 2 }, async () => {
            console.log('内层上下文:', asyncInsight.getContext());
        });
        console.log('回到外层上下文:', asyncInsight.getContext());
    });
}

// 3. 资源泄漏检测演示
function leakDetectionDemo() {
    console.log('\n=== 资源泄漏检测示例 ===');
    asyncInsight.on('resource.leak', (leaks) => {
        console.error(`检测到${leaks.length}个资源泄漏:`, leaks.map(l => ({
            asyncId: l.id,
            type: l.type,
            age: l.duration
        })));
    });

    // 创建一个会被检测为泄漏的定时器
    setInterval(() => {}, 1000);
    console.log('已创建未销毁的定时器，5秒后将触发泄漏告警');
}

// 4. 事件监听演示
function eventListeningDemo() {
    console.log('\n=== 事件监听示例 ===');
    
    // 监听资源初始化事件
    asyncInsight.on('resource.init', (resourceInfo) => {
        if (resourceInfo.type === 'Timeout' && Math.random() > 0.8) { // 只打印一部分事件避免过多输出
            console.log('资源初始化:', { type: resourceInfo.type, id: resourceInfo.id });
        }
    });

    // 创建一些异步资源来触发事件
    setTimeout(() => {}, 100);
    Promise.resolve().then(() => {});
}

// 5. 资源计数演示
function resourceCountDemo() {
    console.log('\n=== 资源计数示例 ===');
    console.log('当前活跃资源数:', asyncInsight.getResourceCount());
    
    // 创建一些异步资源
    const promises = [];
    for (let i = 0; i < 5; i++) {
        promises.push(Promise.resolve(i));
    }
    
    setTimeout(() => {
        console.log('创建资源后活跃资源数:', asyncInsight.getResourceCount());
    }, 200);
}

// 运行所有演示
(async () => {
    console.log('AsyncInsight 系统验证测试开始...\n');
    
    // 运行各个演示函数
    await basicContextDemo();
    await nestedContextDemo();
    eventListeningDemo();
    resourceCountDemo();
    leakDetectionDemo();
    
    // 等待泄漏检测生效，然后退出进程
    setTimeout(() => {
        console.log('\n演示完成，正在关闭 AsyncInsight...');
        asyncInsight.shutdown();
        console.log('AsyncInsight 已成功关闭，测试完成！');
        process.exit(0);
    }, 10000);
})();