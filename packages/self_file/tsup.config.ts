import { defineConfig } from 'tsup'
import path from 'path'

const getBrowserShimsPath = () => 
    path.resolve(__dirname, '../../scripts/browser-shims.js');

export default defineConfig({
    entry: ['src/index.ts'],
    outDir: 'dist',
    format: ['esm', 'cjs', 'iife'],
    globalName: 'SelfFile',
    dts: true,
    minify: true,
    splitting: true,
    clean: true,
    sourcemap: true,
    platform: 'neutral',
    target: ['es2016', 'node14'],
    external: [],
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