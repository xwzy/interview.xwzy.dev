import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import AuthGate from './components/AuthGate'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { MasteryProvider } from './context/MasteryContext'
import { VerdictProvider } from './context/InterviewContext'
import { SessionProvider } from './context/SessionContext'
import { CustomQuestionsProvider, BankProvider } from './context/BankContext'
import { FavoritesProvider } from './context/FavoritesContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ErrorBoundary>
        <AuthProvider>
          <AuthGate>
            <ThemeProvider>
            <CustomQuestionsProvider>
              <BankProvider>
                <FavoritesProvider>
                  <MasteryProvider>
                    <VerdictProvider>
                      <SessionProvider>
                        <App />
                      </SessionProvider>
                    </VerdictProvider>
                  </MasteryProvider>
                </FavoritesProvider>
              </BankProvider>
            </CustomQuestionsProvider>
          </ThemeProvider>
        </AuthGate>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>,
)

// 生产环境注册 Service Worker（可安装、离线回退）；开发模式不注册避免热更新干扰
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => {
        // 注册失败（如非安全上下文）时静默降级为普通站点
      })
  })
}

// 部署新版本后，旧标签页请求已不存在的懒加载 chunk 会失败——自动刷新恢复。
// 10 秒内只自动刷新一次，防止弱网/代理下 preload 持续失败形成刷新循环。
window.addEventListener('vite:preloadError', () => {
  const key = 'interview-preload-reload-at'
  const last = Number(sessionStorage.getItem(key) || 0)
  if (Date.now() - last < 10_000) return
  sessionStorage.setItem(key, String(Date.now()))
  window.location.reload()
})
