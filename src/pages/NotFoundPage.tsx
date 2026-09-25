import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <p className="text-5xl">🧭</p>
      <h1 className="text-xl font-bold">页面不存在</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        你要找的方向或领域可能还没整理，先回题库看看吧。
      </p>
      <Link
        to="/"
        className="mt-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        返回题库
      </Link>
    </div>
  )
}
