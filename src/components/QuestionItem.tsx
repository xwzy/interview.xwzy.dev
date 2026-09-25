import { memo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import type { NormalizedQuestion } from '../types'
import { difficultyMeta } from '../types'
import { useMastery } from '../context/MasteryContext'
import { useFavorites } from '../context/FavoritesContext'
import { cx } from '../lib/utils'
import AnswerBody from './AnswerBody'

interface QuestionItemProps {
  question: NormalizedQuestion
  /** 页面内序号（从 0 开始） */
  index: number
  /** 跟随页面的「显示/收起全部答案」开关 */
  defaultOpen: boolean
  /** 自定义题目：显示标记并允许编辑/删除 */
  custom?: boolean
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

/** 刷题模式下的题目卡片：可展开要点与追问，可标记掌握；自定义题可编辑/删除。
 *  memo：筛选输入等父级重渲染时，内容未变的题卡跳过重渲染（markdown 解析是重开销）。 */
function QuestionItemImpl({
  question,
  index,
  defaultOpen,
  custom,
  onEdit,
  onDelete,
}: QuestionItemProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { isMastered, toggle } = useMastery()
  const { isFavorite, toggleFavorite } = useFavorites()
  const navigate = useNavigate()
  const mastered = isMastered(question.id)
  const favorite = isFavorite(question.id)

  useEffect(() => {
    setOpen(defaultOpen)
  }, [defaultOpen])

  useEffect(() => {
    if (!confirmDelete) return
    const timer = setTimeout(() => setConfirmDelete(false), 3000)
    return () => clearTimeout(timer)
  }, [confirmDelete])

  const meta = difficultyMeta[question.difficulty]

  return (
    <article
      id={question.id}
      className={cx(
        'qa-card scroll-mt-20 overflow-hidden rounded-xl border bg-white transition-colors dark:bg-white/[0.03]',
        mastered
          ? 'border-emerald-300 dark:border-emerald-500/30'
          : 'border-slate-200 dark:border-white/10',
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex-1 text-left"
          aria-expanded={open}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className={cx('rounded px-1.5 py-0.5 text-[11px] font-medium', meta.className)}>
              {meta.label}
            </span>
            {custom && (
              <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[11px] font-medium text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                ✎ 自定义
              </span>
            )}
            {question.tags?.map((tag) => (
              <span
                key={tag}
                role="link"
                tabIndex={0}
                title={`查看「${tag}」标签下的全部题目`}
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/search?q=${encodeURIComponent(tag)}`)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation()
                    navigate(`/search?q=${encodeURIComponent(tag)}`)
                  }
                }}
                className="cursor-pointer text-xs text-slate-400 transition-colors hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400"
              >
                #{tag}
              </span>
            ))}
          </div>
          <h3 className="mt-1.5 font-medium leading-relaxed">{question.title}</h3>
          <span className="mt-1 inline-block text-xs text-slate-400 dark:text-slate-500">
            {open ? '收起要点 ▲' : '展开要点 ▼'}
          </span>
        </button>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <button
            type="button"
            onClick={() => toggleFavorite(question.id)}
            aria-pressed={favorite}
            title={favorite ? '取消收藏' : '收藏此题'}
            aria-label={favorite ? '取消收藏' : '收藏此题'}
            className={cx(
              'rounded-full border px-2 py-0.5 text-xs transition-colors',
              favorite
                ? 'border-amber-400 bg-amber-400/90 text-white'
                : 'border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-500 dark:border-white/10 dark:hover:border-amber-500/40',
            )}
          >
            {favorite ? '★ 已收藏' : '☆ 收藏'}
          </button>
          <button
            type="button"
            onClick={() => toggle(question.id)}
            aria-pressed={mastered}
            title={mastered ? '已掌握（点击取消）' : '标记为已掌握'}
            className={cx(
              'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
              mastered
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : 'border-slate-300 text-slate-500 hover:border-emerald-400 hover:text-emerald-600 dark:border-white/20 dark:text-slate-400 dark:hover:border-emerald-500/50 dark:hover:text-emerald-300',
            )}
          >
            {mastered ? '✓ 已掌握' : '标记掌握'}
          </button>
          {custom && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onEdit?.(question.id)}
                title="编辑此题"
                className="rounded-md border border-slate-200 px-2 py-0.5 text-[11px] text-slate-500 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:text-slate-400 dark:hover:border-blue-500/40"
              >
                ✎ 编辑
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmDelete) {
                    onDelete?.(question.id)
                  } else {
                    setConfirmDelete(true)
                  }
                }}
                className={cx(
                  'rounded-md border px-2 py-0.5 text-[11px] transition-colors',
                  confirmDelete
                    ? 'border-rose-400 bg-rose-500 text-white'
                    : 'border-slate-200 text-slate-500 hover:border-rose-300 hover:text-rose-500 dark:border-white/10 dark:text-slate-400 dark:hover:border-rose-500/40',
                )}
              >
                {confirmDelete ? '确认删除？' : '删除'}
              </button>
            </div>
          )}
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 dark:border-white/5">
          <AnswerBody question={question} />
        </div>
      )}
    </article>
  )
}

export default memo(QuestionItemImpl)
