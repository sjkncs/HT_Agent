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
function CodeBlock({ className, children, inline, ...qoderProps }) {
  if (inline) {
    return (
      <code
        style={{ ...({
          background: 'var(--code-bg, #f0f0f0)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.88em',
          fontFamily: "'SF Mono', 'Fira Code', Consolas, monospace",
        }), ...(qoderProps?.style) }}
       className={className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
        {children}
      </code>
    )
  }

  const lang = (className || '').replace('language-', '').replace('hljs', '').trim()

  return (
    <div style={{ position: 'relative', margin: '8px 0' }} data-qoder-id="qel-div-8947778c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-8947778c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/MarkdownRenderer.jsx&quot;,&quot;componentName&quot;:&quot;CodeBlock&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:36,&quot;column&quot;:5}}">
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
         data-qoder-id="qel-div-8a47791f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-8a47791f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/MarkdownRenderer.jsx&quot;,&quot;componentName&quot;:&quot;CodeBlock&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:38,&quot;column&quot;:9}}">
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
       data-qoder-id="qel-pre-484aed4e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pre-484aed4e&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/MarkdownRenderer.jsx&quot;,&quot;componentName&quot;:&quot;CodeBlock&quot;,&quot;elementRole&quot;:&quot;pre&quot;,&quot;loc&quot;:{&quot;line&quot;:52,&quot;column&quot;:7}}">
        <code className={className} data-qoder-id="qel-code-199fba03" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-code-199fba03&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/MarkdownRenderer.jsx&quot;,&quot;componentName&quot;:&quot;CodeBlock&quot;,&quot;elementRole&quot;:&quot;code&quot;,&quot;loc&quot;:{&quot;line&quot;:64,&quot;column&quot;:9}}">{children}</code>
      </pre>
    </div>
  )
}

// 链接组件
function SafeLink({ href, children, ...qoderProps }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ ...({
        color: 'var(--link-color, #1677ff)',
        textDecoration: 'none',
      }), ...(qoderProps?.style) }}
      onMouseEnter={(e) => (e.target.style.textDecoration = 'underline')}
      onMouseLeave={(e) => (e.target.style.textDecoration = 'none')}
     className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {children}
    </a>
  )
}

// 表格组件
function StyledTable({ children, ...qoderProps }) {
  return (
    <div style={{ ...({ overflowX: 'auto', margin: '8px 0' }), ...(qoderProps?.style) }} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
        }}
       data-qoder-id="qel-table-c8c36991" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-table-c8c36991&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/MarkdownRenderer.jsx&quot;,&quot;componentName&quot;:&quot;StyledTable&quot;,&quot;elementRole&quot;:&quot;table&quot;,&quot;loc&quot;:{&quot;line&quot;:93,&quot;column&quot;:7}}">
        {children}
      </table>
    </div>
  )
}

function StyledTh({ children, ...qoderProps }) {
  return (
    <th
      style={{ ...({
        padding: '8px 12px',
        borderBottom: '2px solid var(--border-color, #e5e5e5)',
        textAlign: 'left',
        fontWeight: 600,
        fontSize: '13px',
        color: 'var(--text-secondary, #666)',
      }), ...(qoderProps?.style) }}
     className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {children}
    </th>
  )
}

function StyledTd({ children, ...qoderProps }) {
  return (
    <td
      style={{ ...({
        padding: '8px 12px',
        borderBottom: '1px solid var(--border-color, #f0f0f0)',
      }), ...(qoderProps?.style) }}
     className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {children}
    </td>
  )
}

// 引用块组件
function BlockQuote({ children, ...qoderProps }) {
  return (
    <blockquote
      style={{ ...({
        borderLeft: '3px solid var(--quote-border, #1677ff)',
        margin: '8px 0',
        padding: '4px 12px',
        color: 'var(--text-secondary, #666)',
        background: 'var(--quote-bg, #f8f9fa)',
        borderRadius: '0 6px 6px 0',
      }), ...(qoderProps?.style) }}
     className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {children}
    </blockquote>
  )
}

// 自定义组件映射
const components = {
  code: ({ className, children, node, ...props }) => {
    const inline = !className && !node?.position?.start?.offset
    return <CodeBlock className={className} inline={inline} {...props} data-qoder-id="qel-codeblock-2f9a3f85" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-codeblock-2f9a3f85&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/MarkdownRenderer.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;codeblock&quot;,&quot;loc&quot;:{&quot;line&quot;:158,&quot;column&quot;:12}}">{children}</CodeBlock>
  },
  a: ({ href, children }) => <SafeLink href={href} data-qoder-id="qel-safelink-30571b2c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-safelink-30571b2c&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/MarkdownRenderer.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;safelink&quot;,&quot;loc&quot;:{&quot;line&quot;:160,&quot;column&quot;:30}}">{children}</SafeLink>,
  table: ({ children }) => <StyledTable data-qoder-id="qel-styledtable-d1c519c7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-styledtable-d1c519c7&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/MarkdownRenderer.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;styledtable&quot;,&quot;loc&quot;:{&quot;line&quot;:161,&quot;column&quot;:28}}">{children}</StyledTable>,
  th: ({ children }) => <StyledTh data-qoder-id="qel-styledth-51237fda" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-styledth-51237fda&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/MarkdownRenderer.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;styledth&quot;,&quot;loc&quot;:{&quot;line&quot;:162,&quot;column&quot;:25}}">{children}</StyledTh>,
  td: ({ children }) => <StyledTd data-qoder-id="qel-styledtd-0e4bfd2f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-styledtd-0e4bfd2f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/MarkdownRenderer.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;styledtd&quot;,&quot;loc&quot;:{&quot;line&quot;:163,&quot;column&quot;:25}}">{children}</StyledTd>,
  blockquote: ({ children }) => <BlockQuote data-qoder-id="qel-blockquote-ed00ee64" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-blockquote-ed00ee64&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/MarkdownRenderer.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;blockquote&quot;,&quot;loc&quot;:{&quot;line&quot;:164,&quot;column&quot;:33}}">{children}</BlockQuote>,
  h1: ({ children }) => <h1 style={{ fontSize: '1.3em', margin: '12px 0 6px' }} data-qoder-id="qel-h1-095c38cd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h1-095c38cd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/MarkdownRenderer.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;h1&quot;,&quot;loc&quot;:{&quot;line&quot;:165,&quot;column&quot;:25}}">{children}</h1>,
  h2: ({ children }) => <h2 style={{ fontSize: '1.15em', margin: '10px 0 5px' }} data-qoder-id="qel-h2-b13d4664" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h2-b13d4664&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/MarkdownRenderer.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;h2&quot;,&quot;loc&quot;:{&quot;line&quot;:166,&quot;column&quot;:25}}">{children}</h2>,
  h3: ({ children }) => <h3 style={{ fontSize: '1.05em', margin: '8px 0 4px' }} data-qoder-id="qel-h3-3a591a26" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h3-3a591a26&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/MarkdownRenderer.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;h3&quot;,&quot;loc&quot;:{&quot;line&quot;:167,&quot;column&quot;:25}}">{children}</h3>,
  ul: ({ children }) => <ul style={{ paddingLeft: '20px', margin: '4px 0' }} data-qoder-id="qel-ul-7daff505" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ul-7daff505&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/MarkdownRenderer.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;ul&quot;,&quot;loc&quot;:{&quot;line&quot;:168,&quot;column&quot;:25}}">{children}</ul>,
  ol: ({ children }) => <ol style={{ paddingLeft: '20px', margin: '4px 0' }} data-qoder-id="qel-ol-5d8b2254" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-ol-5d8b2254&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/MarkdownRenderer.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;ol&quot;,&quot;loc&quot;:{&quot;line&quot;:169,&quot;column&quot;:25}}">{children}</ol>,
  li: ({ children }) => <li style={{ margin: '2px 0', lineHeight: '1.6' }} data-qoder-id="qel-li-a1625f5b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-li-a1625f5b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/MarkdownRenderer.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;li&quot;,&quot;loc&quot;:{&quot;line&quot;:170,&quot;column&quot;:25}}">{children}</li>,
  p: ({ children }) => <p style={{ margin: '4px 0', lineHeight: '1.6' }} data-qoder-id="qel-p-87ef2db4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-87ef2db4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/MarkdownRenderer.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:171,&quot;column&quot;:24}}">{children}</p>,
  hr: () => <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '12px 0' }}  data-qoder-id="qel-hr-539631eb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-hr-539631eb&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/MarkdownRenderer.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;hr&quot;,&quot;loc&quot;:{&quot;line&quot;:172,&quot;column&quot;:13}}"/>,
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
      <div className={className} style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', ...style }} data-qoder-id="qel-div-014563be" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-014563be&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/MarkdownRenderer.jsx&quot;,&quot;componentName&quot;:&quot;MarkdownRenderer&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:192,&quot;column&quot;:7}}">
        {content}
      </div>
    )
  }

  return (
    <div
      className={`markdown-body ${className || ''}`}
      style={{ lineHeight: '1.6', fontSize: '14px', ...style }}
     data-qoder-id="qel-div-02456551" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-02456551&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/MarkdownRenderer.jsx&quot;,&quot;componentName&quot;:&quot;MarkdownRenderer&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:199,&quot;column&quot;:5}}">
      <ReactMarkdown
        remarkPlugins={plugins.remarkPlugins}
        rehypePlugins={plugins.rehypePlugins}
        components={components}
       data-qoder-id="qel-reactmarkdown-f3a636e8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-reactmarkdown-f3a636e8&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/chat/MarkdownRenderer.jsx&quot;,&quot;componentName&quot;:&quot;MarkdownRenderer&quot;,&quot;elementRole&quot;:&quot;reactmarkdown&quot;,&quot;loc&quot;:{&quot;line&quot;:203,&quot;column&quot;:7}}">
        {content}
      </ReactMarkdown>
    </div>
  )
}
