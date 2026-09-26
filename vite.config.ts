import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * 部署基路径（部署目标：Cloudflare Pages，自定义域名根路径）：
 * - 默认 '/'（本地开发与 CF Pages 均为根路径，npm run dev 直接访问 localhost:5173/）
 * - 如需子路径部署（如 GitHub Pages），设置环境变量：VITE_BASE_PATH=/xxx/ npm run build
 * BrowserRouter basename / SW 注册路径 / check-dist 均从 BASE_URL 派生。
 */
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
})
