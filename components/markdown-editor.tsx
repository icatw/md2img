"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Editor } from "@monaco-editor/react"
import { Loader2 } from "lucide-react"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  height?: string
  theme?: string
  themeStyle?: string
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  height = "calc(100vh - 220px)",
  theme = "light",
  themeStyle = "default",
}) => {
  const [mounted, setMounted] = useState(false)
  const editorRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 根据主题和风格获取Monaco编辑器主题
  const getMonacoTheme = () => {
    if (theme === "dark") {
      switch (themeStyle) {
        case "github":
          return "vs-dark"
        case "notion":
          return "vs-dark"
        case "chatgpt":
          return "vs-dark"
        default:
          return "vs-dark"
      }
    } else {
      switch (themeStyle) {
        case "github":
          return "github"
        case "notion":
          return "light"
        case "chatgpt":
          return "light"
        default:
          return "light"
      }
    }
  }

  // 编辑器加载完成后的回调
  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
    setIsLoading(false)

    // 配置编辑器
    editor.updateOptions({
      lineNumbers: "on",
      wordWrap: "on",
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: 14,
      tabSize: 2,
    })
  }

  // 确保组件只在客户端渲染
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-opacity-50 bg-background z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <Editor
        height={height}
        defaultLanguage="markdown"
        value={value}
        onChange={(value) => onChange(value || "")}
        theme={getMonacoTheme()}
        onMount={handleEditorDidMount}
        options={{
          scrollBeyondLastLine: false,
          wordWrap: "on",
          lineNumbers: "on",
          minimap: { enabled: false },
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize: 14,
        }}
      />
    </div>
  )
}

export default MarkdownEditor
