import { defineConfig } from 'tsup'
import path from 'path'

// 获取浏览器垫片路径
const getBrowserShimsPath = () => 
    path.resolve(__dirname, '../../scripts/browser-shims.js');

const NODE_INTERNAL_MODULES = ['async_hooks', 'crypto', 'path', 'node:events'];

const EXTERNAL_DEPENDENCIES = ['express', 'prom-client', 'uuid', 'winston', 'winston-daily-rotate-file'];

export default defineConfig({
    entry: ['src/index.ts'],
    outDir: 'dist',
    format: ['esm', 'cjs', 'iife'],
    globalName: 'AsyncInsight',
    dts: true,
    minify: true,
    splitting: true,
    clean: true,
    sourcemap: true,
    platform: 'node',
    target: ['es2016', 'node14'],
    external: [...EXTERNAL_DEPENDENCIES, ...NODE_INTERNAL_MODULES],
    plugins: [],
    esbuildOptions(options, context) {
        if (context.format === 'esm') {
            options.outdir = 'dist/esm';
        } 
        else if (context.format === 'cjs') {
            options.outdir = 'dist/cjs';
        } 
        else if (context.format === 'iife') {
            options.outdir = 'dist/iife';
            options.external = ['path', 'buffer'];
            options.inject = [getBrowserShimsPath()];
        }
    }
});