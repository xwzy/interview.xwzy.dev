import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// 模块级常量：引用稳定，避免每次渲染重建让 react-markdown 内部组件树失效
const REMARK_PLUGINS = [remarkGfm]

const COMPONENTS = {
  a: ({ node: _node, ...props }: { node?: unknown } & Record<string, unknown>) => (
    <a {...props} target="_blank" rel="noreferrer" />
  ),
}

function MarkdownImpl({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={COMPONENTS as never}>
      {children}
    </ReactMarkdown>
  )
}

/** memo：内容不变时跳过 markdown 重解析——筛选、输入等引起的父级重渲染不再触发解析 */
export default memo(MarkdownImpl)
