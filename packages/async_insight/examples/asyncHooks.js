// const async_hooks = require('node:async_hooks');

// // 创建钩子实例
// // 定义我们关心的资源类型
// const interestedTypes = new Set(['Timeout', 'Promise']);

// // 限制日志输出数量
// let logCount = 0;
// const maxLogs = 50;

// // 安全的日志函数
// function safeLog(...args) {
//   if (logCount < maxLogs) {
//     // 使用原始的process.stdout.write避免触发更多异步钩子
//     process.stdout.write(args.join(' ') + '\n');
//     logCount++;
//   }
// }

// const hook = async_hooks.createHook({
//   init(asyncId, type, triggerAsyncId, resource) {
//     // 只记录我们关心的资源类型
//     if (interestedTypes.has(type)) {
//       safeLog(`[init] 资源类型: ${type}, ID: ${asyncId}, 触发者ID: ${triggerAsyncId}`);
//     }
//   },
//   before(asyncId) {
//     // before事件通常不做过滤
//     safeLog(`[before] 资源 ${asyncId} 的回调即将执行`);
//   },
//   after(asyncId) {
//     // after事件通常不做过滤
//     safeLog(`[after] 资源 ${asyncId} 的回调执行完成`);
//   },
//   destroy(asyncId) {
//     // destroy事件通常不做过滤
//     safeLog(`[destroy] 资源 ${asyncId} 已销毁`);
//   },
//   promiseResolve(asyncId) {
//     // 只记录Promise解析事件
//     safeLog(`[promiseResolve] Promise ${asyncId} 已解析`);
//   }
// });

// // 启用钩子
// hook.enable();

// // 测试异步资源（定时器）
// setTimeout(() => {
//   process.stdout.write('定时器回调执行\n');
  
//   // 3秒后禁用钩子并退出进程
//   setTimeout(() => {
//     process.stdout.write('演示完成，禁用钩子并退出\n');
//     hook.disable();
//     process.exit(0);
//   }, 3000);
// }, 100);

// // 测试Promise
// Promise.resolve().then(() => {
//   process.stdout.write('Promise回调执行\n');
// });





// const { createHook, executionAsyncId } = require('node:async_hooks');
// const { stdout } = require('node:process');
// const net = require('node:net');
// const fs = require('node:fs');

// createHook({
//   init(asyncId, type, triggerAsyncId) {
//     const eid = executionAsyncId();
//     fs.writeSync(
//       stdout.fd,
//       `${type}(${asyncId}): trigger: ${triggerAsyncId} execution: ${eid}\n`);
//   },
// }).enable();

// net.createServer((conn) => {}).listen(8080);



const async_hooks = require('node:async_hooks');
const fs = require('node:fs');
const net = require('node:net');
const { fd } = process.stdout;

let indent = 0;
async_hooks.createHook({
  init(asyncId, type, triggerAsyncId) {
    const eid = async_hooks.executionAsyncId();
    const indentStr = ' '.repeat(indent);
    fs.writeSync(
      fd,
      `${indentStr}${type}(${asyncId}):` +
      ` trigger: ${triggerAsyncId} execution: ${eid}\n`);
  },
  before(asyncId) {
    const indentStr = ' '.repeat(indent);
    fs.writeSync(fd, `${indentStr}before:  ${asyncId}\n`);
    indent += 2;
  },
  after(asyncId) {
    indent -= 2;
    const indentStr = ' '.repeat(indent);
    fs.writeSync(fd, `${indentStr}after:  ${asyncId}\n`);
  },
  destroy(asyncId) {
    const indentStr = ' '.repeat(indent);
    fs.writeSync(fd, `${indentStr}destroy:  ${asyncId}\n`);
  },
}).enable();

net.createServer(() => {}).listen(8080, () => {
  // Let's wait 10ms before logging the server started.
  setTimeout(() => {
    console.log('>>>', async_hooks.executionAsyncId());
  }, 10);
});
