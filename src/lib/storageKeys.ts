/** 全站 localStorage 键名的唯一出处。新增/改名前注意：index.html 的内联主题脚本里也有一份 interview.theme 字面量 */
export const LS_KEYS = {
  customQuestions: 'interview.custom-questions.v1',
  verdicts: 'interview.verdicts.v1',
  sessions: 'interview.sessions.v1',
  mastery: 'interview.mastery.v1',
  favorites: 'interview.favorites.v1',
  theme: 'interview.theme',
  auth: 'interview.auth.v1',
  quizTopics: 'interview.quiz-topics.v1',
  quizResume: 'interview.quiz-resume.v1',
} as const

/** sessionStorage 键（出题现场快照等会话级数据），与 LS_KEYS 分开管理 */
export const SS_KEYS = {
  preloadReloadAt: 'interview-preload-reload-at',
} as const
