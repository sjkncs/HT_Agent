/**
 * Markdown 渲染器
 * 移植 Proma 的 Markdown 渲染能力（react-markdown + rehype + remark）
 *
 * 支持：GFM 表格/任务列表、数学公式(KaTeX)、代码高亮、原始 HTML
 */
import React, { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight'

// 代码块组件
function CodeBlock({ className, children, inline }) {
  if (inline) {
    return (
      <code
        style={{
          background: 'var(--code-bg, #f0f0f0)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.88em',
          fontFamily: "'SF Mono', 'Fira Code', Consolas, monospace",
        }}
      >
        {children}
      </code>
    )
  }

  const lang = (className || '').replace('language-', '').replace('hljs', '').trim()

  return (
    <div style={{ position: 'relative', margin: '8px 0' }}>
      {lang && (
        <div
          style={{
            position: 'absolute',
            top: '6px',
            right: '10px',
            fontSize: '11px',
            color: '#999',
            fontFamily: 'sans-serif',
            textTransform: 'uppercase',
          }}
        >
          {lang}
        </div>
      )}
      <pre
        style={{
          background: 'var(--code-block-bg, #1e1e2e)',
          color: 'var(--code-block-fg, #cdd6f4)',
          padding: '14px 16px',
          borderRadius: '8px',
          overflow: 'auto',
          fontSize: '13px',
          lineHeight: '1.5',
          margin: 0,
        }}
      >
        <code className={className}>{children}</code>
      </pre>
    </div>
  )
}

// 链接组件
function SafeLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: 'var(--link-color, #1677ff)',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => (e.target.style.textDecoration = 'underline')}
      onMouseLeave={(e) => (e.target.style.textDecoration = 'none')}
    >
      {children}
    </a>
  )
}

// 表格组件
function StyledTable({ children }) {
  return (
    <div style={{ overflowX: 'auto', margin: '8px 0' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
        }}
      >
        {children}
      </table>
    </div>
  )
}

function StyledTh({ children }) {
  return (
    <th
      style={{
        padding: '8px 12px',
        borderBottom: '2px solid var(--border-color, #e5e5e5)',
        textAlign: 'left',
        fontWeight: 600,
        fontSize: '13px',
        color: 'var(--text-secondary, #666)',
      }}
    >
      {children}
    </th>
  )
}

function StyledTd({ children }) {
  return (
    <td
      style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--border-color, #f0f0f0)',
      }}
    >
      {children}
    </td>
  )
}

// 引用块组件
function BlockQuote({ children }) {
  return (
    <blockquote
      style={{
        borderLeft: '3px solid var(--quote-border, #1677ff)',
        margin: '8px 0',
        padding: '4px 12px',
        color: 'var(--text-secondary, #666)',
        background: 'var(--quote-bg, #f8f9fa)',
        borderRadius: '0 6px 6px 0',
      }}
    >
      {children}
    </blockquote>
  )
}

// 自定义组件映射
const components = {
  code: ({ className, children, node, ...props }) => {
    const inline = !className && !node?.position?.start?.offset
    return <CodeBlock className={className} inline={inline} {...props}>{children}</CodeBlock>
  },
  a: ({ href, children }) => <SafeLink href={href}>{children}</SafeLink>,
  table: ({ children }) => <StyledTable>{children}</StyledTable>,
  th: ({ children }) => <StyledTh>{children}</StyledTh>,
  td: ({ children }) => <StyledTd>{children}</StyledTd>,
  blockquote: ({ children }) => <BlockQuote>{children}</BlockQuote>,
  h1: ({ children }) => <h1 style={{ fontSize: '1.3em', margin: '12px 0 6px' }}>{children}</h1>,
  h2: ({ children }) => <h2 style={{ fontSize: '1.15em', margin: '10px 0 5px' }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ fontSize: '1.05em', margin: '8px 0 4px' }}>{children}</h3>,
  ul: ({ children }) => <ul style={{ paddingLeft: '20px', margin: '4px 0' }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ paddingLeft: '20px', margin: '4px 0' }}>{children}</ol>,
  li: ({ children }) => <li style={{ margin: '2px 0', lineHeight: '1.6' }}>{children}</li>,
  p: ({ children }) => <p style={{ margin: '4px 0', lineHeight: '1.6' }}>{children}</p>,
  hr: () => <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '12px 0' }} />,
}

/**
 * Markdown 渲染组件
 */
export default function MarkdownRenderer({ content, className, style }) {
  const plugins = useMemo(() => ({
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [rehypeRaw, rehypeKatex, rehypeHighlight],
  }), [])

  if (!content) return null

  // 检测是否包含 markdown 特殊语法
  const hasMarkdown = /[*_`#\[\]|>\\$\\{-]/.test(content)

  if (!hasMarkdown) {
    // 纯文本，直接渲染（保留换行）
    return (
      <div className={className} style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', ...style }}>
        {content}
      </div>
    )
  }

  return (
    <div
      className={`markdown-body ${className || ''}`}
      style={{ lineHeight: '1.6', fontSize: '14px', ...style }}
    >
      <ReactMarkdown
        remarkPlugins={plugins.remarkPlugins}
        rehypePlugins={plugins.rehypePlugins}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
