import { useEffect, useState } from 'react'
import { formatDuration } from '../../lib/utils'

/** 本题用时显示：秒级自跳的独立组件，把每秒重渲染限制在计时文本本身 */
export default function ElapsedTimer({ startTs }: { startTs: number }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(timer)
  }, [])
  const elapsed = Math.max(0, Math.floor((Date.now() - startTs) / 1000))
  return (
    <span title="本题用时">
      <span aria-hidden>⏱</span>
      <span className="sr-only">本题已用时</span> {formatDuration(elapsed)}
    </span>
  )
}
