import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router'
import { useTheme } from '../context/ThemeContext'
import { themeModeMeta } from '../lib/themeMeta'
import { subscribeStorageWriteFailed } from '../lib/usePersistentState'
import { cx } from '../lib/utils'
import PwaUpdateBanner from './PwaUpdateBanner'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    // 命中区扩大：视觉尺寸不变，纵向伪元素外扩 6px（横向相邻的导航项只扩纵向，
    // 避免命中区相互抢占），移动端导航更易点中
    'relative whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-medium transition-colors after:absolute after:inset-x-0 after:-inset-y-1.5 after:content-[""] sm:px-3 sm:text-sm',
    isActive
      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white',
  )

function Header() {
  const [keyword, setKeyword] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { mode, cycleMode } = useTheme()
  const themeMeta = themeModeMeta[mode]

  // 在搜索结果页时，头部输入框与 URL 的 q 保持同步（前进/后退、外部导航均一致）
  useEffect(() => {
    if (location.pathname === '/search') {
      setKeyword(searchParams.get('q') ?? '')
    } else {
      setKeyword('')
    }
  }, [location.pathname, searchParams])

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
              aria-label="搜索题目"
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
            onClick={cycleMode}
            aria-label={`主题：${themeMeta.label}（点击切换）`}
            title={`主题：${themeMeta.label}，点击切换`}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
          >
            {themeMeta.icon}
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

/** 每个路由的页面标题：浏览器标签页可区分，读屏窗口列表可辨认 */
const ROUTE_TITLES: Array<[prefix: string, title: string]> = [
  ['/quiz', '面试出题'],
  ['/search', '搜索'],
  ['/history', '考察记录'],
  ['/settings', '数据管理'],
]

const DEFAULT_TITLE = '面试宝典 · 互联网技术面试知识库'

function RouteTitle() {
  const { pathname } = useLocation()
  useEffect(() => {
    const hit = ROUTE_TITLES.find(([prefix]) => pathname.startsWith(prefix))
    document.title = hit ? `${hit[1]} · 面试宝典` : DEFAULT_TITLE
  }, [pathname])
  return null
}

/** 导航后的焦点管理：把焦点移入主内容区，读屏用户才能感知"页面已切换"。
    页面自行管理焦点（如搜索框 autoFocus）时跳过 */
function useFocusMainOnNavigate(mainRef: React.RefObject<HTMLElement | null>) {
  const { pathname } = useLocation()
  useEffect(() => {
    if (document.activeElement === document.body) {
      mainRef.current?.focus({ preventScroll: true })
    }
  }, [pathname, mainRef])
}

/** localStorage 写盘失败横幅：静默丢进度比报错更糟，至少要让用户知道并引导导出备份 */
function StorageFailBanner() {
  const [visible, setVisible] = useState(false)
  useEffect(
    () => subscribeStorageWriteFailed(() => setVisible(true)),
    [],
  )
  if (!visible) return null
  return (
    <div
      role="status"
      className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <p className="min-w-0 flex-1">
          ⚠️ 浏览器存储写入失败（可能已满或被禁用），本次会话的进度不会被保存。建议到
          <Link to="/settings" className="mx-1 font-medium underline">
            数据管理
          </Link>
          导出备份，或清理浏览器存储后刷新。
        </p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="关闭提示"
          className="shrink-0 rounded p-1 hover:bg-amber-100 dark:hover:bg-amber-500/20"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default function Layout() {
  const mainRef = useRef<HTMLElement>(null)
  useFocusMainOnNavigate(mainRef)
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <ScrollToTop />
      <RouteTitle />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        跳到主内容
      </a>
      <Header />
      <StorageFailBanner />
      <PwaUpdateBanner />
      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 outline-none sm:px-6"
      >
        <Outlet />
      </main>
    </div>
  )
}
