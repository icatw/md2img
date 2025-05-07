"use client"

import type React from "react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import {
  tomorrow,
  oneLight,
  vscDarkPlus,
  vs,
  dracula,
  solarizedlight,
} from "react-syntax-highlighter/dist/esm/styles/prism"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import "./theme-styles.css"

interface MarkdownPreviewProps {
  markdown: string
  themeStyle?: string
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ markdown, themeStyle = "default" }) => {
  // 通过检查父元素是否有dark类来检测是否处于暗色模式
  const isDarkMode = document.querySelector(".markdown-preview.dark") !== null

  // 根据主题风格选择代码高亮样式
  const getCodeStyle = () => {
    if (isDarkMode) {
      switch (themeStyle) {
        case "github":
          return dracula // GitHub暗色替代
        case "notion":
          return tomorrow // Notion暗色替代
        case "chatgpt":
          return vscDarkPlus
        default:
          return tomorrow
      }
    } else {
      switch (themeStyle) {
        case "github":
          return solarizedlight // GitHub亮色替代
        case "notion":
          return oneLight // Notion亮色替代
        case "chatgpt":
          return vs
        default:
          return oneLight
      }
    }
  }

  return (
    <ReactMarkdown
      className="prose prose-sm sm:prose lg:prose-lg max-w-none dark:prose-invert"
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "")
          return !inline && match ? (
            <SyntaxHighlighter
              style={getCodeStyle()}
              language={match[1]}
              PreTag="div"
              {...props}
              customStyle={{
                margin: "1.5em 0",
                borderRadius: "6px",
              }}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          )
        },
        p({ node, children, ...props }) {
          return (
            <p style={{ marginBottom: "1.2em", lineHeight: "1.8" }} {...props}>
              {children}
            </p>
          )
        },
        ul({ node, children, ...props }) {
          return (
            <ul style={{ marginBottom: "1.2em", paddingLeft: "1.5em" }} {...props}>
              {children}
            </ul>
          )
        },
        ol({ node, children, ...props }) {
          return (
            <ol style={{ marginBottom: "1.2em", paddingLeft: "1.5em" }} {...props}>
              {children}
            </ol>
          )
        },
        li({ node, children, ...props }) {
          return (
            <li style={{ marginBottom: "0.5em" }} {...props}>
              {children}
            </li>
          )
        },
        table({ node, ...props }) {
          return (
            <div className="overflow-x-auto my-6">
              <table className="border-collapse border border-slate-300 dark:border-slate-700 w-full" {...props} />
            </div>
          )
        },
        th({ node, ...props }) {
          return (
            <th
              className="border border-slate-300 dark:border-slate-700 px-4 py-2 bg-slate-100 dark:bg-slate-800 font-semibold text-left"
              {...props}
            />
          )
        },
        td({ node, ...props }) {
          return <td className="border border-slate-300 dark:border-slate-700 px-4 py-2" {...props} />
        },
        img({ node, ...props }) {
          return <img className="max-w-full h-auto rounded-md my-6" {...props} loading="lazy" />
        },
        blockquote({ node, ...props }) {
          return (
            <blockquote className="border-l-4 border-slate-300 dark:border-slate-700 pl-4 italic my-6" {...props} />
          )
        },
        h1({ node, ...props }) {
          return <h1 style={{ marginTop: "1.5em", marginBottom: "0.75em" }} {...props} />
        },
        h2({ node, ...props }) {
          return <h2 style={{ marginTop: "1.5em", marginBottom: "0.75em" }} {...props} />
        },
        h3({ node, ...props }) {
          return <h3 style={{ marginTop: "1.5em", marginBottom: "0.75em" }} {...props} />
        },
        h4({ node, ...props }) {
          return <h4 style={{ marginTop: "1.5em", marginBottom: "0.75em" }} {...props} />
        },
        h5({ node, ...props }) {
          return <h5 style={{ marginTop: "1.5em", marginBottom: "0.75em" }} {...props} />
        },
        h6({ node, ...props }) {
          return <h6 style={{ marginTop: "1.5em", marginBottom: "0.75em" }} {...props} />
        },
      }}
    >
      {markdown}
    </ReactMarkdown>
  )
}

export default MarkdownPreview
