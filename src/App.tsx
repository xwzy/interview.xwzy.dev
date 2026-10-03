import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { Route, Routes } from 'react-router'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import { FullBankGate } from './context/BankContext'
import { isLowBandwidth } from './lib/utils'

// 路由级代码分割：首屏只加载首页，其余页面按需加载
const TrackPage = lazy(() => import('./pages/TrackPage'))
const TopicPage = lazy(() => import('./pages/TopicPage'))
const QuizPage = lazy(() => import('./pages/QuizPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function PageLoader() {
  return (
    <div className="flex justify-center py-24 text-sm text-slate-400 dark:text-slate-500">
      加载中…
    </div>
  )
}

/** 需要完整题目内容（要点/追问）的路由：分包加载期间显示题库加载页 */
function withGate(ui: ReactNode) {
  return (
    <Suspense fallback={<PageLoader />}>
      <FullBankGate>{ui}</FullBankGate>
    </Suspense>
  )
}

export default function App() {
  // 空闲时预取路由分包：首次加载后站内切换路由不再出现加载态。
  // 省流模式 / 弱网下跳过——预取是锦上添花，不替用户花流量
  useEffect(() => {
    if (isLowBandwidth()) return
    const preload = () => {
      // 部署新版后旧 chunk 404 会 reject：静默即可，vite:preloadError 处理器负责自动刷新
      const silent = (p: Promise<unknown>) => p.catch(() => {})
      silent(import('./pages/QuizPage'))
      silent(import('./pages/TrackPage'))
      silent(import('./pages/TopicPage'))
      silent(import('./pages/SearchPage'))
      silent(import('./pages/HistoryPage'))
      silent(import('./pages/SettingsPage'))
      silent(import('./pages/NotFoundPage'))
    }
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      cancelIdleCallback?: (handle: number) => void
    }
    const idle = w.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 2000))
    const handle = idle(preload, { timeout: 5000 })
    return () => {
      if (w.cancelIdleCallback) w.cancelIdleCallback(handle)
      else window.clearTimeout(handle)
    }
  }, [])

  return (
    <Routes>
      <Route element={<Layout />}>
        {/* 首页/方向页只依赖内联元数据，即时渲染，不等内容分包 */}
        <Route
          index
          element={
            <Suspense fallback={<PageLoader />}>
              <HomePage />
            </Suspense>
          }
        />
        <Route
          path="tracks/:trackId"
          element={
            <Suspense fallback={<PageLoader />}>
              <TrackPage />
            </Suspense>
          }
        />
        <Route path="tracks/:trackId/:topicId" element={withGate(<TopicPage />)} />
        <Route path="quiz" element={withGate(<QuizPage />)} />
        <Route path="search" element={withGate(<SearchPage />)} />
        <Route path="history" element={withGate(<HistoryPage />)} />
        <Route path="settings" element={withGate(<SettingsPage />)} />
        <Route
          path="*"
          element={
            <Suspense fallback={<PageLoader />}>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  )
}
