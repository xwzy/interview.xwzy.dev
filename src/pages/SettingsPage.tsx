import { useEffect, useRef, useState } from 'react'
import { useMasteryState, useMasteryActions } from '../context/MasteryContext'
import { useVerdicts } from '../context/InterviewContext'
import { useSessions } from '../context/SessionContext'
import { useBank, useCustomQuestions } from '../context/BankContext'
import { useFavoritesState, useFavoritesActions } from '../context/FavoritesContext'
import { useAuth } from '../context/AuthContext'
import { buildTracksMarkdown } from '../lib/exportMd'
import { BACKUP_VERSION, sanitizeBackup, type BackupFile } from '../lib/backup'
import { LS_KEYS } from '../lib/storageKeys'
import { canInstall, promptInstall, subscribeCanInstall } from '../lib/pwaInstall'
import { cx } from '../lib/utils'

function download(filename: string, content: string, mime = 'application/json') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** 文件名时间戳：精确到分钟，同日多次导出不再互相覆盖 */
function timestamp(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

/** 数据管理：刷题进度、考察记录的导出 / 导入 / 清空（全部只涉及浏览器本地数据） */
export default function SettingsPage() {
  const mastered = useMasteryState()
  const { clear: clearMastery } = useMasteryActions()
  const { verdicts, clear: clearVerdicts } = useVerdicts()
  const { sessions, clear: clearSessions } = useSessions()
  const { customQuestions, clearCustom } = useCustomQuestions()
  const favorites = useFavoritesState()
  const { clear: clearFavorites } = useFavoritesActions()
  const { logout } = useAuth()
  const { tracks } = useBank()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [confirmClear, setConfirmClear] = useState<string | null>(null)
  // 导入成功后进入刷新态：全屏遮罩阻断一切交互——导入是直写 localStorage，
  // 刷新前任何 Context 状态变化都会把旧内存值重新写回、覆盖刚导入的数据
  const [reloading, setReloading] = useState(false)
  const [installable, setInstallable] = useState(canInstall())

  useEffect(
    () =>
      subscribeCanInstall(() => {
        setInstallable(canInstall())
      }),
    [],
  )

  // 连续 flash 时先清掉前一个定时器，避免旧定时器把新消息提前清掉
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flash = (kind: 'ok' | 'err', text: string) => {
    setMessage({ kind, text })
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
    flashTimerRef.current = setTimeout(() => setMessage(null), 3000)
  }

  useEffect(
    () => () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current)
      if (reloadTimerRef.current) clearTimeout(reloadTimerRef.current)
    },
    [],
  )

  const handleExport = () => {
    const backup: BackupFile = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      mastery: [...mastered],
      verdicts: { ...verdicts },
      sessions,
      customQuestions,
      favorites: [...favorites],
    }
    download(`interview-backup-${timestamp()}.json`, JSON.stringify(backup, null, 2))
    flash('ok', '备份文件已下载')
  }

  const handleExportMarkdown = () => {
    const md = buildTracksMarkdown(tracks, new Date())
    download(`interview-questions-${timestamp()}.md`, md, 'text/markdown')
    flash('ok', '题库 Markdown 已下载')
  }

  const handleImport = async (file: File) => {
    let backup: BackupFile | null = null
    try {
      backup = sanitizeBackup(JSON.parse(await file.text()))
    } catch {
      flash('err', '导入失败：文件不是有效的 JSON')
      return
    }
    if (!backup) {
      flash('err', '导入失败：文件结构或版本不符，请确认导出自本站的备份文件')
      return
    }
    // 事务化写入：先留旧值快照，任一键写入失败（如存储配额满）则回滚，避免半新半旧
    const entries = [
      [LS_KEYS.mastery, JSON.stringify(backup.mastery)],
      [LS_KEYS.verdicts, JSON.stringify(backup.verdicts)],
      [LS_KEYS.sessions, JSON.stringify(backup.sessions)],
      [LS_KEYS.customQuestions, JSON.stringify(backup.customQuestions)],
      [LS_KEYS.favorites, JSON.stringify(backup.favorites)],
    ] as const
    const snapshots = entries.map(([key]) => [key, localStorage.getItem(key)] as const)
    try {
      for (const [key, value] of entries) localStorage.setItem(key, value)
    } catch (err) {
      for (const [key, old] of snapshots) {
        try {
          if (old === null) localStorage.removeItem(key)
          else localStorage.setItem(key, old)
        } catch {
          // 回滚失败（存储彻底不可用）：保留现状并提示
        }
      }
      const quota =
        err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22)
      flash(
        'err',
        quota
          ? '导入失败：浏览器存储空间不足，请先清理浏览器数据或减少考察记录后重试'
          : '导入失败：无法写入浏览器存储（可能被禁用），原始数据已恢复',
      )
      return
    }
    flash('ok', `导入成功：${backup.mastery.length} 条掌握记录 · ${backup.sessions.length} 份考察记录，正在刷新页面`)
    // 立即进入刷新态：遮罩阻断后续交互，防止残留的旧内存状态在刷新前把导入数据覆盖回去
    setReloading(true)
    const timer = setTimeout(() => window.location.reload(), 600)
    // 组件卸载（用户手动导航走）时取消 reload，不在其他页面突然整页刷新
    reloadTimerRef.current = timer
  }

  /** 双击确认式清空：category 唯一标识 */
  const clearAll = (
    category: 'mastery' | 'verdicts' | 'sessions' | 'custom' | 'favorites' | 'auth',
  ) => {
    if (confirmClear !== category) {
      setConfirmClear(category)
      setTimeout(() => setConfirmClear((c) => (c === category ? null : c)), 3000)
      return
    }
    if (category === 'mastery') {
      clearMastery()
      flash('ok', '刷题进度已清空')
    } else if (category === 'verdicts') {
      clearVerdicts()
      flash('ok', '评分记录已清空')
    } else if (category === 'sessions') {
      clearSessions()
      flash('ok', '考察记录已清空')
    } else if (category === 'custom') {
      clearCustom()
      flash('ok', '自定义题目已清空')
    } else if (category === 'favorites') {
      clearFavorites()
      flash('ok', '收藏记录已清空')
    } else if (category === 'auth') {
      logout()
      window.location.reload()
    }
    setConfirmClear(null)
  }

  const clearButton = (
    category: 'mastery' | 'verdicts' | 'sessions' | 'custom' | 'favorites' | 'auth',
    count: number,
  ) => (
    <button
      type="button"
      onClick={() => clearAll(category)}
      disabled={count === 0}
      className={cx(
        'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        confirmClear === category
          ? 'border-rose-400 bg-rose-500 text-white'
          : 'border-slate-200 text-slate-500 hover:border-rose-300 hover:text-rose-500 dark:border-white/10 dark:text-slate-400 dark:hover:border-rose-500/40',
      )}
    >
      {confirmClear === category ? '再次点击确认清空' : `清空（${count}）`}
    </button>
  )

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {reloading && (
        <div
          role="status"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm"
        >
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-medium shadow-xl dark:border-white/10 dark:bg-slate-900 dark:text-slate-100">
            导入成功，正在刷新页面…
          </div>
        </div>
      )}
      <header>
        <h1 className="text-xl font-bold sm:text-2xl">⚙️ 数据管理</h1>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
          刷题进度、评分与考察记录全部保存在浏览器本地（localStorage），换设备或清理浏览器前请先导出备份。
        </p>
      </header>

      {message && (
        <p
          className={cx(
            'rounded-xl border px-4 py-2.5 text-sm',
            message.kind === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300'
              : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300',
          )}
        >
          {message.text}
        </p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
        <h2 className="font-semibold">备份与恢复</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          导出为一个 JSON 文件；导入时会覆盖当前的掌握记录与评分，并替换考察记录。
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            导出全部数据 ⬇
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-blue-400 hover:text-blue-600 dark:border-white/20 dark:text-slate-300"
          >
            导入备份 ⬆
          </button>
          <button
            type="button"
            onClick={handleExportMarkdown}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-blue-400 hover:text-blue-600 dark:border-white/20 dark:text-slate-300"
          >
            导出题库 Markdown 📄
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImport(file)
              e.target.value = ''
            }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Markdown 导出包含全部方向/领域/题目/要点/追问（含自定义题目），适合打印或导入笔记工具。
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
        <h2 className="font-semibold">安装应用</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          安装到主屏幕 / 桌面后可全屏使用并支持离线访问，数据仍保存在浏览器本地。
        </p>
        {installable ? (
          <button
            type="button"
            onClick={async () => {
              const ok = await promptInstall()
              if (ok) flash('ok', '已安装，可在主屏幕 / 桌面打开')
            }}
            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            📲 安装到本设备
          </button>
        ) : (
          <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            当前浏览器未提供一键安装：
            iOS 请在 Safari 中点「分享 → 添加到主屏幕」；Android/桌面 Chrome 在地址栏或菜单里选「安装应用」。
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
        <h2 className="font-semibold">清空数据</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          每类数据独立清空，操作需两次点击确认，清空后不可恢复。考察记录最多保留最近 50 份，更早的自动淘汰。
        </p>
        <ul className="mt-3 space-y-2.5 text-sm">
          <li className="flex flex-wrap items-center gap-3">
            <span className="w-40 text-slate-600 dark:text-slate-300">刷题掌握进度</span>
            {clearButton('mastery', mastered.size)}
          </li>
          <li className="flex flex-wrap items-center gap-3">
            <span className="w-40 text-slate-600 dark:text-slate-300">题目评分记录</span>
            {clearButton('verdicts', Object.keys(verdicts).length)}
          </li>
          <li className="flex flex-wrap items-center gap-3">
            <span className="w-40 text-slate-600 dark:text-slate-300">考察记录</span>
            {clearButton('sessions', sessions.length)}
          </li>
          <li className="flex flex-wrap items-center gap-3">
            <span className="w-40 text-slate-600 dark:text-slate-300">自定义题目</span>
            {clearButton('custom', customQuestions.length)}
          </li>
          <li className="flex flex-wrap items-center gap-3">
            <span className="w-40 text-slate-600 dark:text-slate-300">收藏题目</span>
            {clearButton('favorites', favorites.size)}
          </li>
          <li className="flex flex-wrap items-center gap-3">
            <span className="w-40 text-slate-600 dark:text-slate-300">访问登录状态</span>
            {clearButton('auth', 1)}
          </li>
        </ul>
      </section>
    </div>
  )
}
