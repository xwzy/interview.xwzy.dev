/** 全站 localStorage 键名的唯一出处。新增/改名前注意：index.html 的内联主题脚本里也有一份 interview.theme 字面量 */
export const LS_KEYS = {
  customQuestions: 'interview.custom-questions.v1',
  verdicts: 'interview.verdicts.v1',
  sessions: 'interview.sessions.v1',
  mastery: 'interview.mastery.v1',
  favorites: 'interview.favorites.v1',
  theme: 'interview.theme',
  auth: 'interview.auth.v1',
} as const
