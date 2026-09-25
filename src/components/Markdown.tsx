import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function MarkdownImpl({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ node, ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
      }}
    >
      {children}
    </ReactMarkdown>
  )
}

/** memo：内容不变时跳过 markdown 重解析——筛选、输入等引起的父级重渲染不再触发解析 */
export default memo(MarkdownImpl)
