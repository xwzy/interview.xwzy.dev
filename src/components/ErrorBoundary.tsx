import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useLocation } from 'react-router'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/** 全局错误边界：渲染异常时显示兜底页，而不是整站白屏 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('页面渲染出错：', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 p-6 text-center text-slate-900 dark:bg-slate-950 dark:text-slate-100">
          <p className="text-4xl">🧯</p>
          <h1 className="text-lg font-bold">页面出了点问题</h1>
          <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
            页面渲染时出现异常，已自动拦截以避免整站白屏。可尝试刷新，或返回首页。
          </p>
          <details className="max-w-md text-left text-xs text-slate-400 dark:text-slate-500">
            <summary className="cursor-pointer select-none hover:text-slate-600 dark:hover:text-slate-300">
              技术详情
            </summary>
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-slate-100 p-3 dark:bg-white/5">
              {this.state.error.message}
            </pre>
          </details>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              刷新页面
            </button>
            <a
              href={import.meta.env.BASE_URL}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-400 dark:border-white/20 dark:text-slate-300"
            >
              返回首页
            </a>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

/** 路由感知包装：切换路由时 key 变化触发重挂载、复位错误状态，单页崩溃后其余页面仍可导航恢复 */
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const location = useLocation()
  return <ErrorBoundary key={location.pathname}>{children}</ErrorBoundary>
}
