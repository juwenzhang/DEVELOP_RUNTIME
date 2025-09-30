const { AsyncInsight } = require('./AsyncInsight');
const options = {
    serviceName: "async_insight",
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    enableResourceLeakDetect: process.env.ENABLE_LEAK_DETECT === 'true'
}

module.exports = AsyncInsight.getInstance(options);
module.exports.AsyncInsight = AsyncInsight;
