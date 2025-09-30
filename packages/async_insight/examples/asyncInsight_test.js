const asyncInsight = require('../src');

async function basicContextDemo() {
    console.log('=== 基础上下文传递示例 ===');
    await asyncInsight.runWithContext({ userId: 'user_123', traceId: 'trace_456' }, async () => {
        console.log('同步代码上下文:', asyncInsight.als.getStore());
        // await Promise.resolve().then(() => {
        //     console.log('Promise上下文:', asyncInsight.als.getStore());
        // });
    });
}

function leakDetectionDemo() {
    console.log('\n=== 资源泄漏检测示例 ===');
    asyncInsight.on('resource.leak', (leaks) => {
        console.error(`检测到${leaks.length}个资源泄漏:`, leaks.map(l => ({
            asyncId: l.asyncId,
            type: l.type,
            age: l.age
        })));
    });

    // 会被检测为泄漏
    // setInterval(() => {}, 1000);
    // console.log('已创建未销毁的定时器，30秒后将触发泄漏告警');
}

(async () => {
  await basicContextDemo();
  leakDetectionDemo();
  
  // 等待30秒让泄漏检测生效，然后退出进程
  setTimeout(() => {
    console.log('演示完成，正在退出...');
    process.exit(0);
  }, 100);
})();