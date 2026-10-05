/**
 * PWA 安装入口：捕获 beforeinstallprompt（浏览器默认 UI 极易被忽略，iOS Safari 干脆
 * 不触发），转成站内「安装应用」按钮。iOS 无此事件，由设置页的引导文案兜底。
 */

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: InstallPromptEvent | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

let initialized = false

/** 在 main.tsx 调用一次：注册事件监听（重复调用安全） */
export function initPwaInstall(): void {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  window.addEventListener('beforeinstallprompt', (e) => {
    // 阻止浏览器自己的迷你安装条，改由站内入口触发
    e.preventDefault()
    deferredPrompt = e as InstallPromptEvent
    emit()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    emit()
  })
}

export function canInstall(): boolean {
  return deferredPrompt !== null
}

/** 触发浏览器安装弹窗；返回用户是否接受（无可用提示时返回 false） */
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false
  const prompt = deferredPrompt
  deferredPrompt = null
  await prompt.prompt()
  try {
    const { outcome } = await prompt.userChoice
    return outcome === 'accepted'
  } finally {
    emit()
  }
}

export function subscribeCanInstall(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
