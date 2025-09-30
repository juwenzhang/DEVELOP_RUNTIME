import { defineConfig } from "rspress/config"
// import dotenv from "@dotenvx/dotenvx"
import path from "path"

// 核心是获取得到 rspress 的运行模式
// const currentRunMode = process.argv.includes('preview') 
//     ? 'preview' 
//     : 'dev'

// dotenv.config({
//     path: path.resolve(__dirname, `.env.${currentRunMode}`),
// })

// const getEnvConfig = (key: string) => {
//     return process.env[key] || ''
// }

export default defineConfig({
    root: path.resolve(__dirname, 'docs'),
    title: 'JUWENZHANG DEVELOPMENT RUNTIME',
    icon: 'https://rspress.rs/rspress-logo.webp',
    logo: {
        light: 'https://rspress.rs/rspress-logo.webp',
        dark: 'https://rspress.rs/rspress-logo.webp',
    },
    themeConfig: {
        lastUpdated: true,
        footer: {
            message: '© 2025-JUWENZHANG Github Inc. @ByteDance @PinDuoDuo @BaiDu',
        },
        socialLinks: [
            {
                icon: 'github',
                mode: 'link',
                content: 'https://github.com/juwenzhang/develop_runtime',
            },
            {
                icon: 'juejin',
                mode: 'link',
                content: 'https://juejin.cn/user/3877322821505440',
            }
        ],
        prevPageText: '上一篇(prevPageText) ⬅️',
        nextPageText: '下一篇(nextPageText) ➡️',
    },
    base: '/develop_runtime/'
})
