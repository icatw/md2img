"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import {
  FileImage,
  FileIcon as FilePdf,
  Upload,
  Moon,
  Sun,
  Clipboard,
  Settings,
  Github,
  Loader2,
  Eye,
  Edit,
  FileText,
  Save,
  Download,
  FileCode,
  Keyboard,
  Info,
} from "lucide-react"
import dynamic from "next/dynamic"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import "@/components/theme-styles.css"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// 动态导入依赖浏览器环境的组件
const MarkdownPreview = dynamic(() => import("@/components/markdown-preview"), { ssr: false })
const ThemePreview = dynamic(() => import("@/components/theme-preview"), { ssr: false })
// 动态导入Monaco编辑器组件
const MarkdownEditor = dynamic(() => import("@/components/markdown-editor"), { ssr: false })

// 修改主函数开始部分，增强夜间模式的对比度
export default function Home() {
  const [markdown, setMarkdown] = useState<string>("")
  const [theme, setTheme] = useState<string>("light")
  const [themeStyle, setThemeStyle] = useState<string>("default")
  const [fontSize, setFontSize] = useState<number>(16)
  const previewRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isExporting, setIsExporting] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("edit")
  const [showEditor, setShowEditor] = useState<boolean>(true)
  const [watermarkText, setWatermarkText] = useState<string>("Markdown转换器 | markdown-converter.vercel.app")
  const [copyImageUrl, setCopyImageUrl] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [autoValidate, setAutoValidate] = useState<boolean>(true)
  const [lineCount, setLineCount] = useState<number>(0)
  const [isMounted, setIsMounted] = useState<boolean>(false)
  const [wordCount, setWordCount] = useState<number>(0)
  const [charCount, setCharCount] = useState<number>(0)
  const [readingTime, setReadingTime] = useState<number>(0)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [autoSave, setAutoSave] = useState<boolean>(true)
  const [autoSaveInterval, setAutoSaveInterval] = useState<number>(60) // 秒
  const [exportProgress, setExportProgress] = useState<number>(0)
  const [showShortcutsDialog, setShowShortcutsDialog] = useState<boolean>(false)
  const [showAboutDialog, setShowAboutDialog] = useState<boolean>(false)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  // 添加水印开关功能
  const [enableWatermark, setEnableWatermark] = useState<boolean>(true)

  // 根据主题和风格获取背景颜色
  const getBackgroundColor = (theme: string, style: string): string => {
    if (theme === "dark") {
      switch (style) {
        case "github":
          return "#0d1117"
        case "notion":
          return "#2f3437"
        case "chatgpt":
          return "#343541"
        default:
          return "#1e1e2e"
      }
    } else {
      switch (style) {
        case "github":
          return "#ffffff"
        case "notion":
          return "#ffffff"
        case "chatgpt":
          return "#ffffff"
        default:
          return "#ffffff"
      }
    }
  }

  // 为首次使用的用户提供示例Markdown
  const sampleMarkdown = `# Markdown转图片转换器

这是一个**强大的工具**，可以将您的Markdown转换为精美的图片和PDF。

## 功能特点

- 使用Markdown进行丰富的文本格式化
- 代码语法高亮
- 表格和列表
- 数学公式（KaTeX）
- 图表（Mermaid）

> 自定义主题、字体和导出设置，创建专业文档

## 代码示例

\`\`\`javascript
// 计算阶乘的简单函数
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}
\`\`\`

## 表格示例

| 功能 | 描述 | 支持 |
|---------|----------------------|------|
| 数学公式 | 使用KaTeX语法表示方程式 | ✅ |
| 图表 | 使用Mermaid语法创建流程图 | ✅ |
| 代码 | 语法高亮 | ✅ |
`

  // 更新字数统计
  const updateWordCount = useCallback((text: string) => {
    // 移除代码块内容以避免统计代码
    const textWithoutCodeBlocks = text.replace(/```[\s\S]*?```/g, "")

    // 计算字符数（不包括空格和换行符）
    const chars = textWithoutCodeBlocks.replace(/\s/g, "").length

    // 计算单词数（中文按字符计算，英文按空格分隔计算）
    // 中文字符范围
    const chineseChars = textWithoutCodeBlocks.match(/[\u4e00-\u9fa5]/g) || []
    // 英文单词
    const englishWords = textWithoutCodeBlocks.match(/[a-zA-Z]+/g) || []

    const words = chineseChars.length + englishWords.length

    // 估算阅读时间（假设平均阅读速度为每分钟300字/词）
    const time = Math.ceil(words / 300)

    setCharCount(chars)
    setWordCount(words)
    setReadingTime(time)

    // 更新行数
    setLineCount(text.split("\n").length)
  }, [])

  // 自动保存功能
  useEffect(() => {
    if (!isMounted || !autoSave || !markdown) return

    const saveInterval = setInterval(() => {
      localStorage.setItem("markdown-content", markdown)
      const now = new Date()
      setLastSaved(now.toLocaleTimeString())

      toast({
        title: "已自动保存",
        description: `内容已在 ${now.toLocaleTimeString()} 自动保存`,
        duration: 2000,
      })
    }, autoSaveInterval * 1000)

    return () => clearInterval(saveInterval)
  }, [isMounted, autoSave, autoSaveInterval, markdown, toast])

  // 键盘快捷键处理
  useEffect(() => {
    if (!isMounted) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S: 保存
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        localStorage.setItem("markdown-content", markdown)
        const now = new Date()
        setLastSaved(now.toLocaleTimeString())

        toast({
          title: "已保存",
          description: `内容已在 ${now.toLocaleTimeString()} 保存`,
          duration: 2000,
        })
      }

      // Ctrl/Cmd + P: 预览
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault()
        setShowEditor(false)
        setActiveTab("preview")
      }

      // Ctrl/Cmd + E: 编辑
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault()
        setShowEditor(true)
        setActiveTab("edit")
      }

      // Ctrl/Cmd + ,: 设置
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault()
        setShowSettings(!showSettings)
      }

      // Ctrl/Cmd + K: 快捷键帮助
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setShowShortcutsDialog(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isMounted, markdown, showSettings, toast])

  // 确保组件只在客户端渲染
  useEffect(() => {
    setIsMounted(true)

    // 尝试从localStorage加载保存的内容和设置
    const savedMarkdown = localStorage.getItem("markdown-content")
    const savedTheme = localStorage.getItem("markdown-theme")
    const savedThemeStyle = localStorage.getItem("markdown-theme-style")
    const savedFontSize = localStorage.getItem("markdown-font-size")
    const savedShowEditor = localStorage.getItem("markdown-show-editor")
    const savedAutoValidate = localStorage.getItem("markdown-auto-validate")
    const savedAutoSave = localStorage.getItem("markdown-auto-save")
    const savedAutoSaveInterval = localStorage.getItem("markdown-auto-save-interval")
    const savedEnableWatermark = localStorage.getItem("markdown-enable-watermark")
    const savedWatermarkText = localStorage.getItem("markdown-watermark-text")

    // 为首次使用的用户设置示例Markdown
    if (savedMarkdown) {
      setMarkdown(savedMarkdown)
      updateWordCount(savedMarkdown)
    } else {
      setMarkdown(sampleMarkdown)
      updateWordCount(sampleMarkdown)
    }

    if (savedTheme) setTheme(savedTheme)
    if (savedThemeStyle) setThemeStyle(savedThemeStyle)
    if (savedFontSize) setFontSize(Number.parseInt(savedFontSize, 10))
    if (savedShowEditor !== null) setShowEditor(savedShowEditor === "true")
    if (savedAutoValidate !== null) setAutoValidate(savedAutoValidate === "true")
    if (savedAutoSave !== null) setAutoSave(savedAutoSave === "true")
    if (savedAutoSaveInterval) setAutoSaveInterval(Number.parseInt(savedAutoSaveInterval, 10))
    if (savedEnableWatermark !== null) setEnableWatermark(savedEnableWatermark === "true")
    if (savedWatermarkText) setWatermarkText(savedWatermarkText)
  }, [updateWordCount])

  // 保存内容和设置到localStorage
  useEffect(() => {
    if (!isMounted) return

    if (markdown) localStorage.setItem("markdown-content", markdown)
    localStorage.setItem("markdown-theme", theme)
    localStorage.setItem("markdown-theme-style", themeStyle)
    localStorage.setItem("markdown-font-size", fontSize.toString())
    localStorage.setItem("markdown-show-editor", showEditor.toString())
    localStorage.setItem("markdown-auto-validate", autoValidate.toString())
    localStorage.setItem("markdown-auto-save", autoSave.toString())
    localStorage.setItem("markdown-auto-save-interval", autoSaveInterval.toString())
    localStorage.setItem("markdown-enable-watermark", enableWatermark.toString())
    localStorage.setItem("markdown-watermark-text", watermarkText)
  }, [
    markdown,
    theme,
    themeStyle,
    fontSize,
    showEditor,
    autoValidate,
    autoSave,
    autoSaveInterval,
    enableWatermark,
    watermarkText,
    isMounted,
  ])

  // 清理临时图片URL
  useEffect(() => {
    if (!isMounted) return

    return () => {
      if (copyImageUrl) {
        URL.revokeObjectURL(copyImageUrl)
      }
    }
  }, [copyImageUrl, isMounted])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setMarkdown(content)
        updateWordCount(content)
        if (autoValidate) validateMarkdown(content)
      }
      reader.readAsText(file)
      toast({
        title: "文件已上传",
        description: `${file.name} 已成功加载。`,
      })
    }
  }

  // 文件拖放处理 - 增强版本
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    // 检查是否真的离开了容器，而不是进入了子元素
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY

    if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.type === "text/markdown" || file.type === "text/plain" || file.name.endsWith(".md")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          setMarkdown(content)
          updateWordCount(content)
          if (autoValidate) validateMarkdown(content)
        }
        reader.readAsText(file)
        toast({
          title: "文件已上传",
          description: `${file.name} 已成功加载。`,
        })
      } else {
        toast({
          title: "不支持的文件类型",
          description: "请上传Markdown或文本文件。",
          variant: "destructive",
        })
      }
    }
  }

  // 添加水印到画布
  const addWatermark = (canvas: HTMLCanvasElement, text: string) => {
    if (!enableWatermark || !text.trim()) return canvas

    const ctx = canvas.getContext("2d")
    if (!ctx) return canvas

    // 设置水印样式
    const fontSize = Math.max(14, canvas.width / 40)
    ctx.font = `${fontSize}px Arial, sans-serif`
    ctx.fillStyle = theme === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)"
    ctx.textAlign = "center"

    // 在底部添加水印，确保有足够的边距
    const padding = fontSize * 2
    const watermarkY = canvas.height - padding

    // 添加半透明背景以确保水印可见
    const textWidth = ctx.measureText(text).width
    const bgPadding = 10
    ctx.fillStyle = theme === "dark" ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.3)"
    ctx.fillRect(
      (canvas.width - textWidth) / 2 - bgPadding,
      watermarkY - fontSize - bgPadding,
      textWidth + bgPadding * 2,
      fontSize + bgPadding * 2,
    )

    // 绘制水印文本
    ctx.fillStyle = theme === "dark" ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)"
    ctx.fillText(text, canvas.width / 2, watermarkY)

    return canvas
  }

  const exportAsPDF = async () => {
    // 如果在编辑模式，先切换到预览模式以确保内容可见
    const wasInEditMode = showEditor && activeTab === "edit"
    if (wasInEditMode) {
      // 临时切换到预览模式
      setActiveTab("preview")
    }

    // 等待DOM更新
    await new Promise((resolve) => setTimeout(resolve, 100))

    if (!previewRef.current) return

    setIsExporting("pdf")
    setExportProgress(10)
    toast({
      title: "正在生成PDF",
      description: "请稍候，我们正在准备您的PDF...",
    })

    try {
      // 添加额外的底部边距，确保内容不会被截断
      const originalStyle = previewRef.current.style.cssText
      previewRef.current.style.paddingBottom = "80px" // 为水印添加更多空间

      setExportProgress(30)
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: getBackgroundColor(theme, themeStyle),
        // 确保捕获完整内容
        windowWidth: previewRef.current.scrollWidth,
        windowHeight: previewRef.current.scrollHeight,
      })

      // 恢复原始样式
      previewRef.current.style.cssText = originalStyle

      setExportProgress(60)

      // 添加水印 - 确保这里的条件检查正确
      let finalCanvas = canvas
      if (enableWatermark && watermarkText.trim()) {
        console.log("Adding watermark to PDF:", watermarkText, "Enabled:", enableWatermark)
        finalCanvas = addWatermark(canvas, watermarkText)
      } else {
        console.log("Watermark not added to PDF. Enabled:", enableWatermark, "Text:", watermarkText)
      }

      const imgData = finalCanvas.toDataURL("image/jpeg", 1.0)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
      })

      setExportProgress(80)
      const imgWidth = 210 // A4宽度（毫米）
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight)
      pdf.save("markdown-export.pdf")

      setExportProgress(100)
      toast({
        title: "PDF已导出",
        description: "您的PDF已成功下载。",
      })
    } catch (error) {
      console.error("导出PDF错误:", error)
      toast({
        title: "导出失败",
        description: "导出PDF时出现错误。",
        variant: "destructive",
      })
    } finally {
      setIsExporting(null)
      setExportProgress(0)
      // 如果之前是编辑模式，恢复
      if (wasInEditMode) {
        setActiveTab("edit")
      }
    }
  }

  const exportAsImage = async () => {
    // 如果在编辑模式，先切换到预览模式以确保内容可见
    const wasInEditMode = showEditor && activeTab === "edit"
    if (wasInEditMode) {
      // 临时切换到预览模式
      setActiveTab("preview")
    }

    // 等待DOM更新
    await new Promise((resolve) => setTimeout(resolve, 100))

    if (!previewRef.current) return

    setIsExporting("image")
    setExportProgress(10)
    toast({
      title: "正在生成图片",
      description: "请稍候，我们正在准备您的图片...",
    })

    try {
      // 添加额外的底部边距，确保内容不会被截断
      const originalStyle = previewRef.current.style.cssText
      previewRef.current.style.paddingBottom = "80px" // 为水印添加更多空间

      setExportProgress(40)
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: getBackgroundColor(theme, themeStyle),
        // 确保捕获完整内容
        windowWidth: previewRef.current.scrollWidth,
        windowHeight: previewRef.current.scrollHeight,
      })

      // 恢复原始样式
      previewRef.current.style.cssText = originalStyle

      setExportProgress(70)

      // 添加水印 - 确保这里的条件检查正确
      let finalCanvas = canvas
      if (enableWatermark && watermarkText.trim()) {
        console.log("Adding watermark:", watermarkText, "Enabled:", enableWatermark)
        finalCanvas = addWatermark(canvas, watermarkText)
      } else {
        console.log("Watermark not added. Enabled:", enableWatermark, "Text:", watermarkText)
      }

      const link = document.createElement("a")
      link.download = "markdown-export.png"
      link.href = finalCanvas.toDataURL("image/png")
      link.click()

      setExportProgress(100)
      toast({
        title: "图片已导出",
        description: "您的图片已成功下载。",
      })
    } catch (error) {
      console.error("导出图片错误:", error)
      toast({
        title: "导出失败",
        description: "导出图片时出现错误。",
        variant: "destructive",
      })
    } finally {
      setIsExporting(null)
      setExportProgress(0)
      // 如果之前是编辑模式，恢复
      if (wasInEditMode) {
        setActiveTab("edit")
      }
    }
  }

  // 导出为HTML
  const exportAsHTML = () => {
    if (!previewRef.current) return

    setIsExporting("html")
    setExportProgress(30)

    try {
      // 创建一个新的HTML文档
      const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown导出</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    pre {
      background-color: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      overflow-x: auto;
    }
    code {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      background-color: #f5f5f5;
      padding: 2px 4px;
      border-radius: 3px;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
    }
    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 16px;
      margin-left: 0;
      color: #666;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  ${previewRef.current.innerHTML}
  ${
    enableWatermark && watermarkText
      ? `
  <div class="footer">
    ${watermarkText}
  </div>
  `
      : ""
  }
</body>
</html>
      `

      setExportProgress(70)

      // 创建Blob对象
      const blob = new Blob([htmlContent], { type: "text/html" })
      const url = URL.createObjectURL(blob)

      // 创建下载链接
      const link = document.createElement("a")
      link.href = url
      link.download = "markdown-export.html"
      link.click()

      // 释放URL对象
      URL.revokeObjectURL(url)

      setExportProgress(100)
      toast({
        title: "HTML已导出",
        description: "您的HTML文件已成功下载。",
      })
    } catch (error) {
      toast({
        title: "导出失败",
        description: "导出HTML时出现错误。",
        variant: "destructive",
      })
    } finally {
      setIsExporting(null)
      setExportProgress(0)
    }
  }

  // 导出为纯文本
  const exportAsText = () => {
    setIsExporting("text")
    setExportProgress(50)

    try {
      // 创建Blob对象
      const blob = new Blob([markdown], { type: "text/plain" })
      const url = URL.createObjectURL(blob)

      // 创建下载链接
      const link = document.createElement("a")
      link.href = url
      link.download = "markdown-export.md"
      link.click()

      // 释放URL对象
      URL.revokeObjectURL(url)

      setExportProgress(100)
      toast({
        title: "Markdown已导出",
        description: "您的Markdown文件已成功下载。",
      })
    } catch (error) {
      toast({
        title: "导出失败",
        description: "导出Markdown时出现错误。",
        variant: "destructive",
      })
    } finally {
      setIsExporting(null)
      setExportProgress(0)
    }
  }

  // 完全重写的复制到剪贴板功能
  const copyToClipboard = async () => {
    // 如果在编辑模式，先切换到预览模式以确保内容可见
    const wasInEditMode = showEditor && activeTab === "edit"
    if (wasInEditMode) {
      // 临时切换到预览模式
      setActiveTab("preview")
    }

    // 等待DOM更新
    await new Promise((resolve) => setTimeout(resolve, 100))

    if (!previewRef.current) return

    setIsExporting("clipboard")
    setExportProgress(10)
    toast({
      title: "正在复制到剪贴板",
      description: "请稍候，我们正在准备您的图片...",
    })

    try {
      // 添加额外的底部边距，确保内容不会被截断
      const originalStyle = previewRef.current.style.cssText
      previewRef.current.style.paddingBottom = "80px" // 为水印添加更多空间

      setExportProgress(40)
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: getBackgroundColor(theme, themeStyle),
        // 确保捕获完整内容
        windowWidth: previewRef.current.scrollWidth,
        windowHeight: previewRef.current.scrollHeight,
      })

      // 恢复原始样式
      previewRef.current.style.cssText = originalStyle

      setExportProgress(70)

      // 添加水印 - 确保这里的条件检查正确
      let finalCanvas = canvas
      if (enableWatermark && watermarkText.trim()) {
        console.log("Adding watermark for clipboard:", watermarkText, "Enabled:", enableWatermark)
        finalCanvas = addWatermark(canvas, watermarkText)
      } else {
        console.log("Watermark not added for clipboard. Enabled:", enableWatermark, "Text:", watermarkText)
      }

      // 将Canvas转换为Blob
      finalCanvas.toBlob(async (blob) => {
        if (blob) {
          try {
            // 创建一个新的ClipboardItem对象
            const clipboardItem = new ClipboardItem({
              [blob.type]: blob,
            })

            // 尝试直接写入剪贴板
            await navigator.clipboard.write([clipboardItem])

            setExportProgress(100)
            toast({
              title: "已复制到剪贴板",
              description: "图片已成功复制到剪贴板，您可以直接粘贴到其他应用中。",
            })
          } catch (clipboardError) {
            console.error("剪贴板API错误:", clipboardError)

            // 如果直接复制失败，尝试创建一个可见的图片元素并提示用户手动复制
            if (copyImageUrl) {
              URL.revokeObjectURL(copyImageUrl)
            }

            const url = URL.createObjectURL(blob)
            setCopyImageUrl(url)

            // 创建一个模态对话框，显示图片并提示用户手动复制
            const modal = document.createElement("div")
            modal.style.position = "fixed"
            modal.style.top = "0"
            modal.style.left = "0"
            modal.style.width = "100%"
            modal.style.height = "100%"
            modal.style.backgroundColor = "rgba(0, 0, 0, 0.8)"
            modal.style.zIndex = "9999"
            modal.style.display = "flex"
            modal.style.flexDirection = "column"
            modal.style.alignItems = "center"
            modal.style.justifyContent = "center"
            modal.style.padding = "20px"

            const modalContent = document.createElement("div")
            modalContent.style.backgroundColor = theme === "dark" ? "#1e1e2e" : "#ffffff"
            modalContent.style.borderRadius = "8px"
            modalContent.style.padding = "20px"
            modalContent.style.maxWidth = "90%"
            modalContent.style.maxHeight = "90%"
            modalContent.style.overflow = "auto"
            modalContent.style.display = "flex"
            modalContent.style.flexDirection = "column"
            modalContent.style.alignItems = "center"

            const title = document.createElement("h3")
            title.textContent = "请手动复制图片"
            title.style.marginBottom = "15px"
            title.style.color = theme === "dark" ? "#ffffff" : "#000000"

            const instructions = document.createElement("p")
            instructions.textContent = '右键点击图片，选择"复制图片"选项'
            instructions.style.marginBottom = "15px"
            instructions.style.color = theme === "dark" ? "#cccccc" : "#333333"

            const img = document.createElement("img")
            img.src = url
            img.style.maxWidth = "100%"
            img.style.maxHeight = "70vh"
            img.style.objectFit = "contain"
            img.style.marginBottom = "15px"
            img.style.border = theme === "dark" ? "1px solid #444" : "1px solid #ddd"

            const closeButton = document.createElement("button")
            closeButton.textContent = "关闭"
            closeButton.style.padding = "8px 16px"
            closeButton.style.backgroundColor = "#f43f5e"
            closeButton.style.color = "white"
            closeButton.style.border = "none"
            closeButton.style.borderRadius = "4px"
            closeButton.style.cursor = "pointer"
            closeButton.onclick = () => {
              document.body.removeChild(modal)
            }

            modalContent.appendChild(title)
            modalContent.appendChild(instructions)
            modalContent.appendChild(img)
            modalContent.appendChild(closeButton)
            modal.appendChild(modalContent)

            document.body.appendChild(modal)

            toast({
              title: "直接复制失败",
              description: "请在弹出窗口中右键点击图片并选择'复制图片'选项。",
              duration: 5000,
            })
          }
        }
      }, "image/png")
    } catch (error) {
      console.error("生成图片错误:", error)
      toast({
        title: "复制失败",
        description: "生成图片时出现错误。请稍后再试。",
        variant: "destructive",
      })
    } finally {
      setIsExporting(null)
      setExportProgress(0)
      // 如果之前是编辑模式，恢复
      if (wasInEditMode) {
        setActiveTab("edit")
      }
    }
  }

  // 复制Markdown文本
  const copyMarkdownText = () => {
    navigator.clipboard
      .writeText(markdown)
      .then(() => {
        toast({
          title: "已复制Markdown文本",
          description: "Markdown文本已复制到剪贴板。",
        })
      })
      .catch(() => {
        toast({
          title: "复制失败",
          description: "复制Markdown文本时出现错误。",
          variant: "destructive",
        })
      })
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const toggleEditor = () => {
    const newShowEditor = !showEditor
    setShowEditor(newShowEditor)
    setActiveTab(newShowEditor ? "edit" : "preview")
  }

  const toggleSettings = () => {
    setShowSettings(!showSettings)
  }

  // 手动保存
  const saveMarkdown = () => {
    localStorage.setItem("markdown-content", markdown)
    const now = new Date()
    setLastSaved(now.toLocaleTimeString())

    toast({
      title: "已保存",
      description: `内容已在 ${now.toLocaleTimeString()} 保存`,
      duration: 2000,
    })
  }

  // 自动验证功能
  const validateMarkdown = (content: string) => {
    if (!autoValidate) return

    // 简单的Markdown验证逻辑
    const errors = []

    // 检查未闭合的代码块
    const codeBlockStarts = (content.match(/```/g) || []).length
    if (codeBlockStarts % 2 !== 0) {
      errors.push("存在未闭合的代码块")
    }

    // 检查未闭合的链接
    const linkOpens = (content.match(/\[/g) || []).length
    const linkCloses = (content.match(/\]/g) || []).length
    if (linkOpens !== linkCloses) {
      errors.push("存在未闭合的链接标记")
    }

    // 如果有错误，显示提示
    if (errors.length > 0) {
      toast({
        title: "Markdown语法警告",
        description: errors.join("；"),
        variant: "destructive",
      })
    }
  }

  const handleMarkdownChange = (value: string) => {
    setMarkdown(value)
    updateWordCount(value)
    validateMarkdown(value)
  }

  // 如果组件尚未挂载，返回加载状态或空内容
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <main
      className={`min-h-screen transition-colors duration-300 ${theme === "dark" ? "bg-slate-900 text-slate-100" : "bg-white text-black"}`}
    >
      {/* 顶部导航栏 */}
      <header
        className={`sticky top-0 z-10 border-b ${theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"} py-2 md:py-3 px-2 md:px-8`}
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 md:w-10 md:h-10 overflow-hidden">
              <img
                src="https://blog-icatwms.oss-cn-beijing.aliyuncs.com/logo.png"
                alt="Markdown编辑器"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className={`text-lg md:text-xl font-bold ${theme === "dark" ? "text-white" : ""}`}>Markdown编辑器</h1>
            <p className={`text-sm hidden md:block ${theme === "dark" ? "text-slate-300" : "text-muted-foreground"}`}>
              编辑Markdown并查看实时预览
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href="https://github.com/icatw/md2img"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-1.5 md:p-2 rounded-full transition-colors ${theme === "dark" ? "hover:bg-slate-800 text-slate-300" : "hover:bg-slate-100"}`}
                  >
                    <Github className="h-4 w-4 md:h-5 md:w-5" />
                  </a>
                </TooltipTrigger>
                <TooltipContent className={theme === "dark" ? "bg-slate-800 text-white border-slate-700" : ""}>
                  <p>查看源代码</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div
              className={`flex items-center gap-1 border rounded-full p-1 px-2 ${theme === "dark" ? "border-slate-700 bg-slate-800" : ""}`}
            >
              <Sun className="h-3 w-3 md:h-4 md:w-4 text-yellow-500" />
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                className={`mx-1 ${theme === "dark" ? "bg-slate-700 data-[state=checked]:bg-primary" : ""}`}
              />
              <Moon className="h-3 w-3 md:h-4 md:w-4 text-slate-400" />
            </div>
          </div>
        </div>
      </header>

      {/* 工具栏 */}
      <div className={`border-b ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`}>
        <div className="container mx-auto py-2 px-2 md:px-8">
          {/* 桌面版工具栏 - 在移动端隐藏 */}
          <div className="hidden md:flex md:flex-wrap md:items-center md:justify-between md:gap-2">
            <div className="flex items-center gap-3">
              {/* 编辑/预览切换按钮组 */}
              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant={showEditor ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setShowEditor(true)
                    setActiveTab("edit")
                  }}
                  className={`rounded-none ${
                    theme === "dark"
                      ? showEditor
                        ? "bg-primary text-primary-foreground"
                        : "bg-slate-800 text-white hover:bg-slate-700"
                      : showEditor
                        ? "bg-primary text-primary-foreground"
                        : ""
                  }`}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  编辑Markdown
                </Button>
                <Button
                  variant={!showEditor ? "default" : "ghost"}
                  size="sm"
                  onClick={() => {
                    setShowEditor(false)
                    setActiveTab("preview")
                  }}
                  className={`rounded-none ${
                    theme === "dark"
                      ? !showEditor
                        ? "bg-primary text-primary-foreground"
                        : "bg-slate-800 text-white hover:bg-slate-700"
                      : !showEditor
                        ? "bg-primary text-primary-foreground"
                        : ""
                  }`}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  预览
                </Button>
              </div>

              <div
                className={`flex items-center gap-1 border rounded-md px-2 py-1 ${theme === "dark" ? "border-slate-600 bg-slate-800" : ""}`}
              >
                <span className={`text-sm ${theme === "dark" ? "text-white" : ""}`}>自动验证</span>
                <Switch size="sm" checked={autoValidate} onCheckedChange={setAutoValidate} />
              </div>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={theme === "dark" ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => document.getElementById("file-upload")?.click()}
                      className={`flex items-center gap-1 ${theme === "dark" ? "bg-slate-800 text-white border-slate-600 hover:bg-slate-700" : ""}`}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      导入Markdown
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className={theme === "dark" ? "bg-slate-800 text-white border-slate-700" : ""}>
                    <p>导入Markdown文件</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <input
                id="file-upload"
                type="file"
                accept=".md, .markdown, .txt"
                className="hidden"
                onChange={handleFileUpload}
              />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={theme === "dark" ? "secondary" : "outline"}
                      size="sm"
                      onClick={saveMarkdown}
                      className={`flex items-center gap-1 ${theme === "dark" ? "bg-slate-800 text-white border-slate-600 hover:bg-slate-700" : ""}`}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      保存
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className={theme === "dark" ? "bg-slate-800 text-white border-slate-700" : ""}>
                    <p>保存当前内容 (Ctrl+S)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={theme === "dark" ? "secondary" : "outline"}
                      size="sm"
                      onClick={copyToClipboard}
                      disabled={isExporting !== null}
                      className={`flex items-center gap-1 ${theme === "dark" ? "bg-slate-800 text-white border-slate-600 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-500" : ""}`}
                    >
                      {isExporting === "clipboard" ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Clipboard className="h-4 w-4 mr-1" />
                      )}
                      复制为图片
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className={theme === "dark" ? "bg-slate-800 text-white border-slate-700" : ""}>
                    <p>复制为图片</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant={theme === "dark" ? "secondary" : "outline"}
                    size="sm"
                    className={`flex items-center gap-1 ${theme === "dark" ? "bg-slate-800 text-white border-slate-600 hover:bg-slate-700" : ""}`}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    导出
                  </Button>
                </DialogTrigger>
                <DialogContent className={theme === "dark" ? "bg-slate-800 border-slate-700 text-white" : ""}>
                  <DialogHeader>
                    <DialogTitle>选择导出格式</DialogTitle>
                    <DialogDescription className={theme === "dark" ? "text-slate-300" : ""}>
                      选择您想要导出的文件格式
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <Button
                      variant={theme === "dark" ? "secondary" : "outline"}
                      onClick={exportAsPDF}
                      disabled={isExporting !== null}
                      className={`flex items-center justify-center gap-2 ${theme === "dark" ? "bg-slate-700 hover:bg-slate-600 text-white" : ""}`}
                    >
                      <FilePdf className="h-5 w-5" />
                      PDF文档
                    </Button>
                    <Button
                      variant={theme === "dark" ? "secondary" : "outline"}
                      onClick={exportAsImage}
                      disabled={isExporting !== null}
                      className={`flex items-center justify-center gap-2 ${theme === "dark" ? "bg-slate-700 hover:bg-slate-600 text-white" : ""}`}
                    >
                      <FileImage className="h-5 w-5" />
                      PNG图片
                    </Button>
                    <Button
                      variant={theme === "dark" ? "secondary" : "outline"}
                      onClick={exportAsHTML}
                      disabled={isExporting !== null}
                      className={`flex items-center justify-center gap-2 ${theme === "dark" ? "bg-slate-700 hover:bg-slate-600 text-white" : ""}`}
                    >
                      <FileCode className="h-5 w-5" />
                      HTML网页
                    </Button>
                    <Button
                      variant={theme === "dark" ? "secondary" : "outline"}
                      onClick={exportAsText}
                      disabled={isExporting !== null}
                      className={`flex items-center justify-center gap-2 ${theme === "dark" ? "bg-slate-700 hover:bg-slate-600 text-white" : ""}`}
                    >
                      <FileText className="h-5 w-5" />
                      Markdown文本
                    </Button>
                  </div>
                  {isExporting && (
                    <div className="mt-2">
                      <p className="text-sm mb-2">正在导出 {isExporting.toUpperCase()} 文件...</p>
                      <Progress value={exportProgress} className="h-2" />
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={theme === "dark" ? "secondary" : "outline"}
                      size="sm"
                      onClick={toggleSettings}
                      className={`flex items-center gap-1 ${theme === "dark" ? "bg-slate-800 text-white border-slate-600 hover:bg-slate-700" : ""}`}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      设置
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className={theme === "dark" ? "bg-slate-800 text-white border-slate-700" : ""}>
                    <p>打开设置面板 (Ctrl+,)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={theme === "dark" ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setShowShortcutsDialog(true)}
                      className={`flex items-center gap-1 ${theme === "dark" ? "bg-slate-800 text-white border-slate-600 hover:bg-slate-700" : ""}`}
                    >
                      <Keyboard className="h-4 w-4 mr-1" />
                      快捷键
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className={theme === "dark" ? "bg-slate-800 text-white border-slate-700" : ""}>
                    <p>查看键盘快捷键 (Ctrl+K)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* 移动端工具栏 - 在桌面端隐藏 */}
          <div className="md:hidden">
            {/* 主要功能按钮 */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Button
                variant={activeTab === "edit" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setShowEditor(true)
                  setActiveTab("edit")
                }}
                className={`w-full ${
                  theme === "dark"
                    ? activeTab === "edit"
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-slate-800 text-white border-slate-600 hover:bg-slate-700 hover:text-white"
                    : ""
                }`}
              >
                <Edit className="h-4 w-4 mr-1" />
                编辑
              </Button>
              <Button
                variant={activeTab === "preview" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setShowEditor(false)
                  setActiveTab("preview")
                }}
                className={`w-full ${
                  theme === "dark"
                    ? activeTab === "preview"
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-slate-800 text-white border-slate-600 hover:bg-slate-700 hover:text-white"
                    : ""
                }`}
              >
                <Eye className="h-4 w-4 mr-1" />
                预览
              </Button>
            </div>

            {/* 次要功能按钮 - 带文字的版本 */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              <Button
                variant={theme === "dark" ? "secondary" : "outline"}
                size="sm"
                onClick={() => document.getElementById("file-upload")?.click()}
                className={`flex items-center justify-center gap-1 ${theme === "dark" ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-white" : ""}`}
              >
                <Upload className="h-4 w-4" />
                <span className="text-xs">导入</span>
              </Button>

              <Button
                variant={theme === "dark" ? "secondary" : "outline"}
                size="sm"
                onClick={saveMarkdown}
                className={`flex items-center justify-center gap-1 ${theme === "dark" ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-white" : ""}`}
              >
                <Save className="h-4 w-4" />
                <span className="text-xs">保存</span>
              </Button>

              <Button
                variant={theme === "dark" ? "secondary" : "outline"}
                size="sm"
                onClick={copyToClipboard}
                disabled={isExporting !== null}
                className={`flex items-center justify-center gap-1 ${theme === "dark" ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-white" : ""}`}
              >
                {isExporting === "clipboard" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Clipboard className="h-4 w-4" />
                )}
                <span className="text-xs">复制</span>
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant={theme === "dark" ? "secondary" : "outline"}
                    size="sm"
                    className={`flex items-center justify-center gap-1 ${theme === "dark" ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-white" : ""}`}
                  >
                    <Download className="h-4 w-4" />
                    <span className="text-xs">导出</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className={theme === "dark" ? "bg-slate-800 border-slate-700 text-white" : ""}>
                  <DialogHeader>
                    <DialogTitle>选择导出格式</DialogTitle>
                    <DialogDescription className={theme === "dark" ? "text-slate-300" : ""}>
                      选择您想要导出的文件格式
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <Button
                      variant={theme === "dark" ? "secondary" : "outline"}
                      onClick={exportAsPDF}
                      disabled={isExporting !== null}
                      className={`flex items-center justify-center gap-2 ${theme === "dark" ? "bg-slate-700 hover:bg-slate-600 text-white" : ""}`}
                    >
                      <FilePdf className="h-5 w-5" />
                      PDF文档
                    </Button>
                    <Button
                      variant={theme === "dark" ? "secondary" : "outline"}
                      onClick={exportAsImage}
                      disabled={isExporting !== null}
                      className={`flex items-center justify-center gap-2 ${theme === "dark" ? "bg-slate-700 hover:bg-slate-600 text-white" : ""}`}
                    >
                      <FileImage className="h-5 w-5" />
                      PNG图片
                    </Button>
                    <Button
                      variant={theme === "dark" ? "secondary" : "outline"}
                      onClick={exportAsHTML}
                      disabled={isExporting !== null}
                      className={`flex items-center justify-center gap-2 ${theme === "dark" ? "bg-slate-700 hover:bg-slate-600 text-white" : ""}`}
                    >
                      <FileCode className="h-5 w-5" />
                      HTML网页
                    </Button>
                    <Button
                      variant={theme === "dark" ? "secondary" : "outline"}
                      onClick={exportAsText}
                      disabled={isExporting !== null}
                      className={`flex items-center justify-center gap-2 ${theme === "dark" ? "bg-slate-700 hover:bg-slate-600 text-white" : ""}`}
                    >
                      <FileText className="h-5 w-5" />
                      Markdown文本
                    </Button>
                  </div>
                  {isExporting && (
                    <div className="mt-2">
                      <p className="text-sm mb-2">正在导出 {isExporting.toUpperCase()} 文件...</p>
                      <Progress value={exportProgress} className="h-2" />
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              <Button
                variant={theme === "dark" ? "secondary" : "outline"}
                size="sm"
                onClick={toggleSettings}
                className={`flex items-center justify-center gap-1 ${theme === "dark" ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-white" : ""}`}
              >
                <Settings className="h-4 w-4" />
                <span className="text-xs">设置</span>
              </Button>

              <Button
                variant={theme === "dark" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowShortcutsDialog(true)}
                className={`flex items-center justify-center gap-1 ${theme === "dark" ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-white" : ""}`}
              >
                <Keyboard className="h-4 w-4" />
                <span className="text-xs">快捷键</span>
              </Button>
            </div>

            {/* 自动验证开关 - 移动端 */}
            <div
              className={`flex items-center justify-between mt-2 px-3 py-2 rounded ${
                theme === "dark" ? "bg-slate-800 border border-slate-600" : "bg-slate-100"
              }`}
            >
              <span className={`text-sm font-medium ${theme === "dark" ? "text-white" : ""}`}>自动验证</span>
              <Switch
                size="sm"
                checked={autoValidate}
                onCheckedChange={setAutoValidate}
                className={theme === "dark" ? "bg-slate-700 data-[state=checked]:bg-primary" : ""}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 编辑器和预览区域 */}
      <div className="container mx-auto p-2 md:p-6">
        {/* 主要内容区域 */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* 编辑器区域 - 可以切换显示/隐藏 */}
          {(showEditor || activeTab === "edit") && (
            <div
              className={`${activeTab !== "edit" && "hidden md:block"} ${showEditor ? "md:w-1/2" : "hidden md:hidden"} transition-all duration-300`}
            >
              {/* 编辑器容器 */}
              <div
                className={`relative border rounded-md transition-all h-[calc(100vh-220px)] md:h-[calc(100vh-180px)] ${
                  theme === "dark" ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"
                } ${isDragging ? "border-primary border-2" : ""}`}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {/* 使用Monaco编辑器替换原来的编辑器 */}
                <MarkdownEditor
                  value={markdown}
                  onChange={handleMarkdownChange}
                  theme={theme}
                  themeStyle={themeStyle}
                />

                {/* 文件拖放指示器 */}
                <div
                  className={`absolute inset-0 bg-primary/20 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${
                    isDragging ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <div
                    className={`p-6 rounded-lg ${theme === "dark" ? "bg-slate-800" : "bg-white"} shadow-lg border-2 border-primary`}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-center font-medium">释放鼠标上传文件</p>
                  </div>
                </div>
              </div>

              {/* 字数统计 */}
              <div className={`mt-2 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                {/* 桌面版统计信息 */}
                <div className="hidden md:flex md:items-center md:justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span>{lineCount} 行</span>
                    <span>|</span>
                    <span>{wordCount} 字</span>
                    <span>|</span>
                    <span>{charCount} 字符</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>预计阅读时间: {readingTime} 分钟</span>
                    {lastSaved && (
                      <>
                        <span>|</span>
                        <span>上次保存: {lastSaved}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 移动端统计信息 - 垂直布局 */}
                <div className="md:hidden text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span>{lineCount} 行</span>
                    <span>
                      {wordCount} 字 / {charCount} 字符
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>预计阅读: {readingTime} 分钟</span>
                    {lastSaved && <span>上次保存: {lastSaved}</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 预览区域 */}
          <div
            className={`${activeTab !== "preview" && "hidden md:block"} ${showEditor ? "md:w-1/2" : "w-full"} transition-all duration-300`}
          >
            <div
              className={`border rounded-md overflow-auto transition-all h-[calc(100vh-220px)] md:h-[calc(100vh-180px)] ${
                isFullscreen ? "fixed inset-0 z-50 p-8" : ""
              } ${theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}
            >
              <div
                ref={previewRef}
                className={`markdown-preview ${theme === "dark" ? "dark" : ""} theme-${themeStyle} p-4 md:p-6`}
                style={{ fontSize: `${fontSize}px` }}
              >
                <MarkdownPreview markdown={markdown} themeStyle={themeStyle} theme={theme} />
              </div>
            </div>
          </div>
        </div>

        {/* 设置面板 - 条件渲染 */}
        {showSettings && (
          <Card
            className={`mt-4 md:mt-6 transition-all ${theme === "dark" ? "bg-slate-800 border-slate-700 text-slate-100" : ""}`}
          >
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <Tabs defaultValue="appearance" className="w-full">
                <TabsList className={`grid grid-cols-3 mb-4 ${theme === "dark" ? "bg-slate-700" : ""}`}>
                  <TabsTrigger
                    value="appearance"
                    className={theme === "dark" ? "data-[state=active]:bg-slate-600" : ""}
                  >
                    外观
                  </TabsTrigger>
                  <TabsTrigger value="editor" className={theme === "dark" ? "data-[state=active]:bg-slate-600" : ""}>
                    编辑器
                  </TabsTrigger>
                  <TabsTrigger value="export" className={theme === "dark" ? "data-[state=active]:bg-slate-600" : ""}>
                    导出
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="appearance">
                  <div className="space-y-4 md:space-y-5">
                    <div>
                      <Label
                        htmlFor="theme-style-select"
                        className={`mb-2 block ${theme === "dark" ? "text-slate-200" : ""}`}
                      >
                        主题风格
                      </Label>
                      <div className="grid grid-cols-2 gap-2 md:gap-3">
                        {["default", "github", "notion", "chatgpt"].map((style) => (
                          <div
                            key={style}
                            className={`cursor-pointer rounded-lg overflow-hidden border transition-all ${
                              themeStyle === style
                                ? "ring-2 ring-primary"
                                : theme === "dark"
                                  ? "border-slate-700"
                                  : "border-slate-200"
                            }`}
                            onClick={() => setThemeStyle(style)}
                          >
                            <ThemePreview
                              themeName={style}
                              isDark={theme === "dark"}
                              isSelected={themeStyle === style}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="font-size" className={`mb-2 block ${theme === "dark" ? "text-slate-200" : ""}`}>
                        字体大小: {fontSize}px
                      </Label>
                      <Slider
                        id="font-size"
                        min={12}
                        max={24}
                        step={1}
                        value={[fontSize]}
                        onValueChange={(value) => setFontSize(value[0])}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="editor">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-validate" className={theme === "dark" ? "text-slate-200" : ""}>
                        自动验证Markdown语法
                      </Label>
                      <Switch id="auto-validate" checked={autoValidate} onCheckedChange={setAutoValidate} />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-save" className={theme === "dark" ? "text-slate-200" : ""}>
                        自动保存内容
                      </Label>
                      <Switch id="auto-save" checked={autoSave} onCheckedChange={setAutoSave} />
                    </div>

                    {autoSave && (
                      <div>
                        <Label
                          htmlFor="auto-save-interval"
                          className={`mb-2 block ${theme === "dark" ? "text-slate-200" : ""}`}
                        >
                          自动保存间隔: {autoSaveInterval}秒
                        </Label>
                        <Slider
                          id="auto-save-interval"
                          min={10}
                          max={300}
                          step={10}
                          value={[autoSaveInterval]}
                          onValueChange={(value) => setAutoSaveInterval(value[0])}
                          className="mt-2"
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="export">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="enable-watermark" className={theme === "dark" ? "text-slate-200" : ""}>
                        启用水印
                      </Label>
                      <Switch id="enable-watermark" checked={enableWatermark} onCheckedChange={setEnableWatermark} />
                    </div>

                    {enableWatermark && (
                      <div>
                        <Label htmlFor="watermark" className={`mb-2 block ${theme === "dark" ? "text-slate-200" : ""}`}>
                          水印文本
                        </Label>
                        <Textarea
                          id="watermark"
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          className={`resize-none h-10 ${
                            theme === "dark" ? "bg-slate-800 text-slate-100 border-slate-700" : ""
                          }`}
                          placeholder="输入导出图片的水印文本"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4">
                      <Button
                        onClick={exportAsPDF}
                        className={`flex items-center gap-2 transition-all ${theme === "dark" ? "bg-slate-800 text-white border-slate-600 hover:bg-slate-700" : ""}`}
                        disabled={isExporting !== null}
                        variant={theme === "dark" ? "secondary" : "default"}
                      >
                        {isExporting === "pdf" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FilePdf className="h-4 w-4" />
                        )}
                        导出为PDF
                      </Button>
                      <Button
                        onClick={exportAsImage}
                        className={`flex items-center gap-2 transition-all ${theme === "dark" ? "bg-slate-800 text-white border-slate-600 hover:bg-slate-700" : ""}`}
                        disabled={isExporting !== null}
                        variant={theme === "dark" ? "secondary" : "default"}
                      >
                        {isExporting === "image" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileImage className="h-4 w-4" />
                        )}
                        导出为PNG
                      </Button>
                      <Button
                        onClick={exportAsHTML}
                        className={`flex items-center gap-2 transition-all ${theme === "dark" ? "bg-slate-800 text-white border-slate-600 hover:bg-slate-700" : ""}`}
                        disabled={isExporting !== null}
                        variant={theme === "dark" ? "secondary" : "default"}
                      >
                        {isExporting === "html" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileCode className="h-4 w-4" />
                        )}
                        导出为HTML
                      </Button>
                      <Button
                        onClick={exportAsText}
                        className={`flex items-center gap-2 transition-all ${theme === "dark" ? "bg-slate-800 text-white border-slate-600 hover:bg-slate-700" : ""}`}
                        disabled={isExporting !== null}
                        variant={theme === "dark" ? "secondary" : "default"}
                      >
                        {isExporting === "text" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        导出为Markdown
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        <footer
          className={`text-center py-3 md:py-4 mt-4 md:mt-6 border-t ${theme === "dark" ? "border-slate-800 text-slate-400" : "border-slate-200 text-muted-foreground"}`}
        >
          <div className="container mx-auto px-2">
            <div className="flex flex-col md:flex-row justify-between items-center gap-2">
              <p className="text-sm md:text-base">Markdown转换器 - 轻松保存和分享您的内容</p>
              <div className="flex items-center gap-3 md:gap-4">
                <a
                  href="#"
                  className={`text-xs md:text-sm hover:underline ${theme === "dark" ? "text-slate-400 hover:text-slate-300" : ""}`}
                  onClick={(e) => {
                    e.preventDefault()
                    setShowShortcutsDialog(true)
                  }}
                >
                  快捷键
                </a>
                <a
                  href="#"
                  className={`text-xs md:text-sm hover:underline ${theme === "dark" ? "text-slate-400 hover:text-slate-300" : ""}`}
                  onClick={(e) => {
                    e.preventDefault()
                    setShowAboutDialog(true)
                  }}
                >
                  关于我们
                </a>
                <a
                  href="https://github.com/icatw/md2img"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-xs md:text-sm hover:underline ${theme === "dark" ? "text-slate-400 hover:text-slate-300" : ""}`}
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* 快捷键对话框 */}
      <Dialog open={showShortcutsDialog} onOpenChange={setShowShortcutsDialog}>
        <DialogContent className={theme === "dark" ? "bg-slate-800 border-slate-700 text-white" : ""}>
          <DialogHeader>
            <DialogTitle>键盘快捷键</DialogTitle>
            <DialogDescription className={theme === "dark" ? "text-slate-300" : ""}>
              使用这些快捷键可以提高您的工作效率
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 items-center gap-4">
              <div className="text-sm font-medium">保存内容</div>
              <div className="flex items-center">
                <Badge variant="outline" className={theme === "dark" ? "bg-slate-700 text-white" : ""}>
                  Ctrl
                </Badge>
                <span className="mx-1">+</span>
                <Badge variant="outline" className={theme === "dark" ? "bg-slate-700 text-white" : ""}>
                  S
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <div className="text-sm font-medium">切换到编辑模式</div>
              <div className="flex items-center">
                <Badge variant="outline" className={theme === "dark" ? "bg-slate-700 text-white" : ""}>
                  Ctrl
                </Badge>
                <span className="mx-1">+</span>
                <Badge variant="outline" className={theme === "dark" ? "bg-slate-700 text-white" : ""}>
                  E
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <div className="text-sm font-medium">切换到预览模式</div>
              <div className="flex items-center">
                <Badge variant="outline" className={theme === "dark" ? "bg-slate-700 text-white" : ""}>
                  Ctrl
                </Badge>
                <span className="mx-1">+</span>
                <Badge variant="outline" className={theme === "dark" ? "bg-slate-700 text-white" : ""}>
                  P
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <div className="text-sm font-medium">打开设置</div>
              <div className="flex items-center">
                <Badge variant="outline" className={theme === "dark" ? "bg-slate-700 text-white" : ""}>
                  Ctrl
                </Badge>
                <span className="mx-1">+</span>
                <Badge variant="outline" className={theme === "dark" ? "bg-slate-700 text-white" : ""}>
                  ,
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 items-center gap-4">
              <div className="text-sm font-medium">显示快捷键</div>
              <div className="flex items-center">
                <Badge variant="outline" className={theme === "dark" ? "bg-slate-700 text-white" : ""}>
                  Ctrl
                </Badge>
                <span className="mx-1">+</span>
                <Badge variant="outline" className={theme === "dark" ? "bg-slate-700 text-white" : ""}>
                  K
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowShortcutsDialog(false)}
              className={theme === "dark" ? "bg-slate-700 hover:bg-slate-600 text-white" : ""}
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 关于对话框 */}
      <Dialog open={showAboutDialog} onOpenChange={setShowAboutDialog}>
        <DialogContent className={theme === "dark" ? "bg-slate-800 border-slate-700 text-white" : ""}>
          <DialogHeader>
            <DialogTitle>关于 Markdown 转换器</DialogTitle>
            <DialogDescription className={theme === "dark" ? "text-slate-300" : ""}>
              一个强大的 Markdown 编辑和导出工具
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-4">
            <img
              src="https://blog-icatwms.oss-cn-beijing.aliyuncs.com/logo.png"
              alt="Markdown编辑器"
              className="w-16 h-16 mb-4"
            />
            <h3 className="text-lg font-bold mb-2">Markdown 转换器</h3>
            <p className="text-sm text-center mb-4">版本 1.0.0</p>
            <p className="text-sm text-center mb-4">
              这是一个强大的工具，可以将您的 Markdown 转换为精美的图片和 PDF。
              支持代码语法高亮、表格和列表、数学公式等功能。
            </p>
            <div className="flex items-center gap-2 mt-2">
              <a
                href="https://github.com/icatw/md2img"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm hover:underline"
              >
                <Github className="h-4 w-4" />
                GitHub
              </a>
              <span>|</span>
              <a href="#" className="flex items-center gap-1 text-sm hover:underline">
                <Info className="h-4 w-4" />
                使用指南
              </a>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowAboutDialog(false)}
              className={theme === "dark" ? "bg-slate-700 hover:bg-slate-600 text-white" : ""}
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </main>
  )
}
