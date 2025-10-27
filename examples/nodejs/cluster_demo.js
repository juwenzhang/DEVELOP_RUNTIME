const cluster = require('cluster');
const http = require('http');
const os = require('os');
const { performance } = require('perf_hooks');
const numCPUs = os.cpus().length;

// 配置项
const config = {
  port: process.env.PORT || 3000,
  workerCount: process.env.WORKER_COUNT ? parseInt(process.env.WORKER_COUNT) : numCPUs, // 默认为 CPU 核心数
  maxMemoryRestart: 500 * 1024 * 1024, // 单个进程内存超过 500MB 自动重启,防止内存泄漏
  healthCheckInterval: 5000, // 健康检查间隔
};

// 核心就是我们的主进程负责管理所有的工作进程，包括启动、重启、监控、以及一些事件的处理等
// 工作进程进行的是定时汇报自己的 CPU 使用率和内存使用量，以及进行处理任务吧

// 主进程逻辑
if (cluster.isPrimary) {
  console.log(`[Master] 启动，PID: ${process.pid}，CPU核心数: ${numCPUs}`);
  console.log(`[Master] 配置：工作进程数=${config.workerCount}，端口=${config.port}`);

  // 存储工作进程信息
  const workerStats = new Map(); // key: worker.id, value: { cpu, memory, lastActive }

  // 启动工作进程
  const startWorkers = (count) => {
    for (let i = 0; i < count; i++) {
      const worker = cluster.fork(); // 复制主进程，创建工作进程
      
      // 记录工作进程初始信息
      workerStats.set(worker.id, {
        cpu: 0,
        memory: 0,
        lastActive: Date.now(),
      });

      // 监听工作进程消息
      worker.on('message', (msg) => {
        if (msg.type === 'stats') {
          workerStats.set(worker.id, { ...msg.data, lastActive: Date.now() });
        }
      });

      // 2. 工作进程崩溃自动重启
      worker.on('exit', (code, signal) => {
        console.error(`[Master] 工作进程 ${worker.id} 退出（code: ${code}, signal: ${signal}），正在重启...`);
        workerStats.delete(worker.id);
        startWorkers(1); // 重启一个新的工作进程
      });
    }
  };

  // 初始启动工作进程
  startWorkers(config.workerCount);

  // 定时健康检查
  setInterval(() => {
    const now = Date.now();
    Object.values(cluster.workers).forEach(worker => {
      const stats = workerStats.get(worker.id);
      if (!stats) return;

      if (stats.memory > config.maxMemoryRestart) {
        console.warn(`[Master] 工作进程 ${worker.id} 内存超限（${stats.memory / 1024 / 1024}MB），强制重启`);
        worker.kill('SIGTERM');
        return;
      }

      // 检查是否长时间无响应
      if (now - stats.lastActive > 15000) {
        console.warn(`[Master] 工作进程 ${worker.id} 无响应，强制重启`);
        worker.kill('SIGTERM');
      }
    });

    // 打印当前监控状态  Prometheus/Grafana
    console.log(`[Master] 监控状态：工作进程数=${Object.keys(cluster.workers).length}`);
    workerStats.forEach((stats, id) => {
      console.log(`- 进程 ${id}: CPU=${stats.cpu.toFixed(2)}%，内存=${(stats.memory / 1024 / 1024).toFixed(2)}MB`);
    });
  }, config.healthCheckInterval);

  // 支持动态调整工作进程数
  process.on('SIGUSR2', () => {
    const currentCount = Object.keys(cluster.workers).length;
    if (currentCount < numCPUs * 2) { // 限制最大进程数为 CPU核心数*2
      console.log(`[Master] 收到 SIGUSR2 信号，新增1个工作进程（当前：${currentCount} → ${currentCount + 1}）`);
      startWorkers(1);
    }
  });

  // 主进程优雅退出
  process.on('SIGTERM', () => {
    console.log(`[Master] 收到退出信号，开始关闭所有工作进程...`);
    cluster.workers.forEach(worker => worker.kill('SIGTERM'));
    setTimeout(() => process.exit(0), 5000);
  });
} else {
  console.log(`[Worker ${cluster.worker.id}] 启动，PID: ${process.pid}`);

  // 创建 HTTP 服务
  const server = http.createServer(async (req, res) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      const result = Array.from({ length: 1000 }, (_, i) => i * 2).reduce((a, b) => a + b, 0);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        workerId: cluster.worker.id,
        pid: process.pid,
        result,
        time: new Date().toISOString()
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });

  server.listen(config.port, () => {
    console.log(`[Worker ${cluster.worker.id}] 服务启动，监听端口 ${config.port}`);
  });

  // 定时向主进程发送性能数据
  setInterval(() => {
    // 计算 CPU 使用率
    const cpuUsage = process.cpuUsage();
    const cpuPercent = ((cpuUsage.user + cpuUsage.system) / (performance.now() * 1000)) * 100;
    
    // 内存使用量
    const memoryUsage = process.memoryUsage().heapUsed;

    // 向主进程发送统计数据
    process.send({
      type: 'stats',
      data: { cpu: cpuPercent, memory: memoryUsage }
    });
  }, config.healthCheckInterval);

  // 工作进程优雅退出
  process.on('SIGTERM', () => {
    console.log(`[Worker ${cluster.worker.id}] 收到退出信号，停止接收新请求...`);
    server.close(() => { // 关闭服务，不再接收新请求
      console.log(`[Worker ${cluster.worker.id}] 所有请求处理完毕，退出`);
      process.exit(0);
    });

    // 10秒超时强制退出
    setTimeout(() => {
      console.warn(`[Worker ${cluster.worker.id}] 退出超时，强制退出`);
      process.exit(1);
    }, 10000);
  });
}
