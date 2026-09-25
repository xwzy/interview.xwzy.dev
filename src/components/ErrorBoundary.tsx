import { Component, type ErrorInfo, type ReactNode } from 'react'

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
            {this.state.error.message}
          </p>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              刷新页面
            </button>
            <a
              href="/"
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
