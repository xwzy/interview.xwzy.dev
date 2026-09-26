import type { Track } from '../types'

/**
 * 各方向题库的动态加载器：数据按方向分包、异步加载，
 * 主包不再包含任何题目内容（首屏体积优化的核心）。
 */
export type TrackLoader = () => Promise<Track>

export const trackLoaders: TrackLoader[] = [
  () => import('./backend').then((m) => m.backendTrack),
  () => import('./frontend').then((m) => m.frontendTrack),
  () => import('./cs-fundamentals').then((m) => m.csTrack),
  () => import('./os').then((m) => m.osTrack),
  () => import('./computer-organization').then((m) => m.computerOrganizationTrack),
  () => import('./system-design').then((m) => m.systemDesignTrack),
  () => import('./big-data').then((m) => m.bigDataTrack),
  () => import('./mobile').then((m) => m.mobileTrack),
  () => import('./ai').then((m) => m.aiTrack),
  () => import('./qa').then((m) => m.qaTrack),
  () => import('./ops').then((m) => m.opsTrack),
  () => import('./career').then((m) => m.careerTrack),
]

export async function loadAllTracks(): Promise<Track[]> {
  const tracks = await Promise.all(trackLoaders.map((load) => load()))
  return tracks
}
