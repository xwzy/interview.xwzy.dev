import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { Route, Routes } from 'react-router'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import { FullBankGate } from './context/BankContext'

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
  // 空闲时预取全部路由分包：首次加载后站内切换路由不再出现加载态
  useEffect(() => {
    const preload = () => {
      void import('./pages/QuizPage')
      void import('./pages/TrackPage')
      void import('./pages/TopicPage')
      void import('./pages/SearchPage')
      void import('./pages/HistoryPage')
      void import('./pages/SettingsPage')
      void import('./pages/NotFoundPage')
    }
    const w = window as unknown as { requestIdleCallback?: (cb: () => void) => number }
    const idle = w.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 300))
    idle(preload)
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
