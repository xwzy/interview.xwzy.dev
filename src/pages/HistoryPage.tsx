import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useBank } from '../context/BankContext'
import { useSessions, type InterviewSession } from '../context/SessionContext'
import { buildSummaryText } from '../lib/summary'
import { verdictMeta } from '../context/InterviewContext'
import { cx, formatDuration } from '../lib/utils'

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function countsOf(session: InterviewSession) {
  const counts = { pass: 0, fail: 0, maybe: 0, unrated: 0 }
  session.items.forEach((item) => {
    counts[item.verdict ?? 'unrated'] += 1
  })
  return counts
}

function summaryOf(session: InterviewSession, questionById: Map<string, { track: { name: string }; topic: { name: string }; question: { title: string } }>) {
  return buildSummaryText(session.items, (id) => {
    const r = questionById.get(id)
    return r ? { title: r.question.title, trackName: r.track.name, topicName: r.topic.name } : undefined
  }, { candidate: session.candidate, date: new Date(session.createdAt) })
}

/** 考察记录：历次面试官模式出卷的存档（评分、备注、可复制小结） */
export default function HistoryPage() {
  const { questionById } = useBank()
  const { sessions, removeSession } = useSessions()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const sorted = useMemo(
    () => [...sessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [sessions],
  )

  const copySummary = async (session: InterviewSession) => {
    const { text } = summaryOf(session, questionById)
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopiedId(session.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-xl font-bold sm:text-2xl">🗂️ 考察记录</h1>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
          历次面试官模式出卷的存档：评分、备注与面试小结都保存在浏览器本地。
        </p>
      </header>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-white/15">
          <p className="text-sm text-slate-400 dark:text-slate-500">
            还没有考察记录。去
            <Link to="/quiz" className="mx-1 font-medium text-blue-600 hover:underline dark:text-blue-400">
              面试出题
            </Link>
            完成一次考察吧。
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {sorted.map((session) => {
            const counts = countsOf(session)
            return (
              <li
                key={session.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.03]"
              >
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <h2 className="font-semibold">
                      {session.candidate || '未命名候选人'}
                    </h2>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {formatDate(session.createdAt)} · {session.items.length} 题
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copySummary(session)}
                        className={cx(
                          'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                          copiedId === session.id
                            ? 'border-emerald-400 text-emerald-600 dark:text-emerald-300'
                            : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:text-slate-300 dark:hover:border-blue-500/40',
                        )}
                      >
                        {copiedId === session.id ? '✓ 已复制' : '复制小结 📋'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirmingId === session.id) {
                            removeSession(session.id)
                            setConfirmingId(null)
                          } else {
                            setConfirmingId(session.id)
                            setTimeout(() => setConfirmingId((c) => (c === session.id ? null : c)), 3000)
                          }
                        }}
                        className={cx(
                          'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                          confirmingId === session.id
                            ? 'border-rose-400 bg-rose-500 text-white'
                            : 'border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-500 dark:border-white/10 dark:hover:border-rose-500/40',
                        )}
                      >
                        {confirmingId === session.id ? '确认删除？' : '删除'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-medium text-emerald-700 dark:text-emerald-300">
                      👍 {counts.pass}
                    </span>
                    <span className="rounded-full bg-rose-500/15 px-2.5 py-0.5 font-medium text-rose-700 dark:text-rose-300">
                      👎 {counts.fail}
                    </span>
                    <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 font-medium text-amber-700 dark:text-amber-300">
                      ➖ {counts.maybe}
                    </span>
                    <span className="rounded-full bg-slate-500/15 px-2.5 py-0.5 font-medium text-slate-600 dark:text-slate-300">
                      未评 {counts.unrated}
                    </span>
                  </div>

                  <details className="group mt-3">
                    <summary className="cursor-pointer list-none text-xs font-medium text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400">
                      展开整卷（{session.items.length} 题）
                    </summary>
                    <ol className="mt-3 space-y-2.5 border-t border-slate-100 pt-3 dark:border-white/5">
                      {session.items.map((item, i) => {
                        const r = questionById.get(item.questionId)
                        return (
                          <li key={item.questionId} className="text-sm">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                              <span className="font-mono">{String(i + 1).padStart(2, '0')}</span>
                              {r && (
                                <span>
                                  {r.track.name} · {r.topic.name}
                                </span>
                              )}
                              {item.verdict && (
                                <span
                                  className={cx(
                                    'rounded-full border px-2 py-0.5 font-medium',
                                    item.verdict === 'pass'
                                      ? 'border-emerald-300 text-emerald-600 dark:border-emerald-500/40 dark:text-emerald-300'
                                      : item.verdict === 'fail'
                                        ? 'border-rose-300 text-rose-600 dark:border-rose-500/40 dark:text-rose-300'
                                        : 'border-amber-300 text-amber-600 dark:border-amber-500/40 dark:text-amber-300',
                                  )}
                                >
                                  {verdictMeta[item.verdict].icon} {verdictMeta[item.verdict].label}
                                </span>
                              )}
                              {item.duration ? (
                                <span title="本题用时">⏱ {formatDuration(item.duration)}</span>
                              ) : null}
                            </div>
                            <p className="mt-1 leading-relaxed">
                              {r?.question.title ?? item.questionId}
                            </p>
                            {item.note && (
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                💬 {item.note}
                              </p>
                            )}
                          </li>
                        )
                      })}
                    </ol>
                  </details>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
