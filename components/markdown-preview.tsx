"use client"

import type React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import "./theme-styles.css"

interface MarkdownPreviewProps {
  markdown: string
  themeStyle?: string
  theme?: string
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ markdown, themeStyle = "default", theme = "light" }) => {
  // 使用传入的主题参数而不是检测DOM
  const isDarkMode = theme === "dark"

  // 获取代码块的类名
  const getCodeBlockClassName = () => {
    if (isDarkMode) {
      switch (themeStyle) {
        case "github":
          return "code-block-dark-github"
        case "notion":
          return "code-block-dark-notion"
        case "chatgpt":
          return "code-block-dark-chatgpt"
        default:
          return "code-block-dark-default"
      }
    } else {
      switch (themeStyle) {
        case "github":
          return "code-block-light-github"
        case "notion":
          return "code-block-light-notion"
        case "chatgpt":
          return "code-block-light-chatgpt"
        default:
          return "code-block-light-default"
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
            <div className={`${getCodeBlockClassName()} rounded-md overflow-hidden my-6`}>
              <div className="px-4 py-2 text-xs border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                {match[1]}
              </div>
              <pre className="p-4 overflow-auto">
                <code className={className} {...props}>
                  {String(children).replace(/\n$/, "")}
                </code>
              </pre>
            </div>
          ) : (
            <code className={`${className} px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800`} {...props}>
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
