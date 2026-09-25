import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useState, type FormEvent } from 'react'
import { useTheme } from '../context/ThemeContext'
import { cx } from '../lib/utils'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    'whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm',
    isActive
      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white',
  )

function Header() {
  const [keyword, setKeyword] = useState('')
  const navigate = useNavigate()
  const { theme, toggle } = useTheme()

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    const q = keyword.trim()
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-bold text-white">
            Q
          </span>
          <span className="hidden font-semibold tracking-tight sm:inline">面试宝典</span>
        </Link>

        <nav className="flex min-w-0 items-center gap-0.5 sm:gap-1">
          <NavLink to="/" end className={navLinkClass}>
            题库
          </NavLink>
          <NavLink to="/quiz" className={navLinkClass}>
            面试出题
          </NavLink>
          <NavLink to="/history" className={navLinkClass}>
            考察记录
          </NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <form onSubmit={handleSearch} className="relative hidden sm:block">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索题目 / 知识点…"
              className="w-40 md:w-56 rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:focus:border-blue-500/50 dark:focus:ring-blue-500/20"
            />
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              ⌕
            </span>
          </form>
          <Link
            to="/search"
            aria-label="搜索"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 sm:hidden dark:text-slate-400 dark:hover:bg-white/10"
          >
            ⌕
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-label="切换深色模式"
            title="切换深色模式"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <ScrollToTop />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        跳到主内容
      </a>
      <Header />
      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 py-6 dark:border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-1 px-4 text-xs text-slate-400 sm:px-6">
          <p>面试宝典 · interview.xwzy.dev — 分类题库持续补充中，内容如有出入欢迎指正</p>
          <p>
            React + Vite + Tailwind CSS 构建 · 进度数据保存在浏览器本地 ·
            <Link to="/settings" className="ml-1 hover:text-blue-600 dark:hover:text-blue-400">
              数据管理
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
