import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * 部署基路径：
 * - GitHub Pages 子路径（https://xwzy.github.io/interview.xwzy.dev/）→ '/interview.xwzy.dev/'
 * - 自定义域名根路径（interview.xwzy.dev，需先添加 DNS CNAME）→ 改回 '/'
 * 两种形态切换时必须同步：BrowserRouter basename 与 SW 注册路径已从 BASE_URL 派生，无需改动。
 */
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/interview.xwzy.dev/',
  plugins: [react(), tailwindcss()],
})
