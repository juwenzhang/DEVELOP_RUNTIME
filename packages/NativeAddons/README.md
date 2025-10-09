* https://nodejs.org/docs/latest/api/addons.html 

* 核心进行的是复刻官网的案例吧

```
pnpm install

pnpm run gyp:configure

pnpm run gyp:build

pnpm run dev
```

* scripts里面的脚本没有很大的作用哈，因为目前还没有解决 `import.meta.url` 的问题

* 因为 NativeAddons 只可以用户 Node.js 环境，所以 scripts 里面的脚本没有很大的作用哈
