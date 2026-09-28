/** 浅色 / 深色 / 跟随系统（默认深色） */
export type ThemeMode = 'light' | 'dark' | 'system'

export const themeModeMeta: Record<ThemeMode, { label: string; icon: string }> = {
  light: { label: '浅色', icon: '☀️' },
  dark: { label: '深色', icon: '🌙' },
  system: { label: '跟随系统', icon: '🖥️' },
}
