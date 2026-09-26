import { useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'

/** 访问门：输入访问密码后进入，本地记忆登录状态（防随手访问与爬虫抓取的轻量门禁） */
export default function AuthGate({ children }: { children: ReactNode }) {
  const { authed, login } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (authed) return <>{children}</>

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!password.trim() || submitting) return
    setSubmitting(true)
    const ok = await login(password)
    setSubmitting(false)
    if (!ok) {
      setError(true)
      setPassword('')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-6 dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex flex-col items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl font-bold text-white">
            Q
          </span>
          <h1 className="text-lg font-bold">面试宝典</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            本站为私人知识库，请输入访问密码
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="password"
            value={password}
            autoFocus
            onChange={(e) => {
              setPassword(e.target.value)
              setError(false)
            }}
            placeholder="访问密码"
            aria-label="访问密码"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:focus:border-blue-500/50 dark:focus:ring-blue-500/20"
          />
          {error && <p className="text-left text-xs text-rose-500">密码不正确，请重试</p>}
          <button
            type="submit"
            disabled={submitting || !password.trim()}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? '验证中…' : '进入'}
          </button>
        </form>

        <p className="mt-5 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
          登录状态保存在本浏览器，无需重复输入
        </p>
      </div>
    </div>
  )
}
