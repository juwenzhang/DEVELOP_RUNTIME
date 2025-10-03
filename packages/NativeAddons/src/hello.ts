const addon = require("../build/Release/addon.node")

// 为什么这里调用的是 want 呢？？
// 因为 `NODE_SET_METHOD(exports, "want", Method);`
// 为什么这里书写的 exports 呢？
// 因为对于我们的 commonjs 的话，到处模块的函数主要是：module.exports 对象或者 exports {} 这来实现的
console.log(addon.want());
