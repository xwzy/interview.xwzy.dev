import { useEffect, useState } from 'react'

/**
 * 新版本提示横幅：SW 更新后以 controllerchange 接管页面，此时页面 JS 还是旧版，
 * 依赖 vite:preloadError 兜底刷新只覆盖「懒加载 chunk 404」一种失败；长驻标签页
 * （尤其 PWA standalone）可能一直停在旧版。这里主动提示用户刷新切换到新版本。
 */
export default function PwaUpdateBanner() {
  const [updated, setUpdated] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const sw = navigator.serviceWorker
    // 首次注册的 SW 接管页面（clients.claim）也会触发 controllerchange，
    // 那不是「更新」：仅当挂载时已有旧 controller 接管过才算版本切换
    let hadController = Boolean(sw.controller)
    const onControllerChange = () => {
      if (!hadController) {
        hadController = true
        return
      }
      setUpdated(true)
    }
    sw.addEventListener('controllerchange', onControllerChange)
    return () => sw.removeEventListener('controllerchange', onControllerChange)
  }, [])

  if (!updated) return null
  return (
    <div
      role="status"
      className="border-b border-blue-300 bg-blue-50 px-4 py-2 text-sm text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        <p className="min-w-0 flex-1">✨ 站点已更新到新版本，刷新后即可使用最新内容。</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          立即刷新
        </button>
      </div>
    </div>
  )
}
