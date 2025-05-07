"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
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
  FileDown,
  Clipboard,
  Settings,
  Github,
  FileText,
  Loader2,
  Eye,
  Edit,
} from "lucide-react"
import MarkdownPreview from "@/components/markdown-preview"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import "@/components/theme-styles.css"
import ThemePreview from "@/components/theme-preview"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function Home() {
  const [markdown, setMarkdown] = useState<string>("")
  const [theme, setTheme] = useState<string>("light")
  const [themeStyle, setThemeStyle] = useState<string>("default")
  const [fontSize, setFontSize] = useState<number>(16)
  const previewRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    // 为首次使用的用户设置示例Markdown
    if (!markdown) {
      setMarkdown(sampleMarkdown)
    }

    // 尝试从localStorage加载保存的内容和设置
    const savedMarkdown = localStorage.getItem("markdown-content")
    const savedTheme = localStorage.getItem("markdown-theme")
    const savedThemeStyle = localStorage.getItem("markdown-theme-style")
    const savedFontSize = localStorage.getItem("markdown-font-size")
    const savedShowEditor = localStorage.getItem("markdown-show-editor")
    const savedAutoValidate = localStorage.getItem("markdown-auto-validate")

    if (savedMarkdown) setMarkdown(savedMarkdown)
    if (savedTheme) setTheme(savedTheme)
    if (savedThemeStyle) setThemeStyle(savedThemeStyle)
    if (savedFontSize) setFontSize(Number.parseInt(savedFontSize, 10))
    if (savedShowEditor !== null) setShowEditor(savedShowEditor === "true")
    if (savedAutoValidate !== null) setAutoValidate(savedAutoValidate === "true")
  }, [])

  // 保存内容和设置到localStorage
  useEffect(() => {
    if (markdown) localStorage.setItem("markdown-content", markdown)
    localStorage.setItem("markdown-theme", theme)
    localStorage.setItem("markdown-theme-style", themeStyle)
    localStorage.setItem("markdown-font-size", fontSize.toString())
    localStorage.setItem("markdown-show-editor", showEditor.toString())
    localStorage.setItem("markdown-auto-validate", autoValidate.toString())
  }, [markdown, theme, themeStyle, fontSize, showEditor, autoValidate])

  // 清理临时图片URL
  useEffect(() => {
    return () => {
      if (copyImageUrl) {
        URL.revokeObjectURL(copyImageUrl)
      }
    }
  }, [copyImageUrl])

  // 更新行数计数
  useEffect(() => {
    setLineCount(markdown.split("\n").length)
  }, [markdown])

  // 同步滚动行号和编辑器
  useEffect(() => {
    const handleEditorScroll = () => {
      if (editorRef.current && lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = editorRef.current.scrollTop
      }
    }

    const editor = editorRef.current
    if (editor) {
      editor.addEventListener("scroll", handleEditorScroll)
      return () => {
        editor.removeEventListener("scroll", handleEditorScroll)
      }
    }
  }, [])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setMarkdown(content)
        if (autoValidate) validateMarkdown(content)
      }
      reader.readAsText(file)
      toast({
        title: "文件已上传",
        description: `${file.name} 已成功加载。`,
      })
    }
  }

  // 文件拖放处理
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.classList.add("border-primary")
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.classList.remove("border-primary")
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.classList.remove("border-primary")

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.type === "text/markdown" || file.type === "text/plain" || file.name.endsWith(".md")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          setMarkdown(content)
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
    const ctx = canvas.getContext("2d")
    if (!ctx) return canvas

    const fontSize = Math.max(12, canvas.width / 50)
    ctx.font = `${fontSize}px Arial`
    ctx.fillStyle = theme === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)"
    ctx.textAlign = "center"

    // 在底部添加水印，确保有足够的边距
    const padding = fontSize * 2
    ctx.fillText(text, canvas.width / 2, canvas.height - padding / 2)

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
    toast({
      title: "正在生成PDF",
      description: "请稍候，我们正在准备您的PDF...",
    })

    try {
      // 添加额外的底部边距，确保内容不会被截断
      const originalStyle = previewRef.current.style.cssText
      previewRef.current.style.paddingBottom = "60px" // 为水印添加额外空间

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

      // 添加水印
      const canvasWithWatermark = addWatermark(canvas, watermarkText)

      const imgData = canvasWithWatermark.toDataURL("image/jpeg", 1.0)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
      })

      const imgWidth = 210 // A4宽度（毫米）
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight)
      pdf.save("markdown-export.pdf")

      toast({
        title: "PDF已导出",
        description: "您的PDF已成功下载。",
      })
    } catch (error) {
      toast({
        title: "导出失败",
        description: "导出PDF时出现错误。",
        variant: "destructive",
      })
    } finally {
      setIsExporting(null)
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
    toast({
      title: "正在生成图片",
      description: "请稍候，我们正在准备您的图片...",
    })

    try {
      // 添加额外的底部边距，确保内容不会被截断
      const originalStyle = previewRef.current.style.cssText
      previewRef.current.style.paddingBottom = "60px" // 为水印添加额外空间

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

      // 添加水印
      const canvasWithWatermark = addWatermark(canvas, watermarkText)

      const link = document.createElement("a")
      link.download = "markdown-export.png"
      link.href = canvasWithWatermark.toDataURL("image/png")
      link.click()

      toast({
        title: "图片已导出",
        description: "您的图片已成功下载。",
      })
    } catch (error) {
      toast({
        title: "导出失败",
        description: "导出图片时出现错误。",
        variant: "destructive",
      })
    } finally {
      setIsExporting(null)
      // 如果之前是编辑模式，恢复
      if (wasInEditMode) {
        setActiveTab("edit")
      }
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
    toast({
      title: "正在复制到剪贴板",
      description: "请稍候，我们正在准备您的图片...",
    })

    try {
      // 添加额外的底部边距，确保内容不会被截断
      const originalStyle = previewRef.current.style.cssText
      previewRef.current.style.paddingBottom = "60px" // 为水印添加额外空间

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

      // 添加水印
      const canvasWithWatermark = addWatermark(canvas, watermarkText)

      // 将Canvas转换为Blob
      canvasWithWatermark.toBlob(async (blob) => {
        if (blob) {
          try {
            // 创建一个新的ClipboardItem对象
            const clipboardItem = new ClipboardItem({
              [blob.type]: blob,
            })

            // 尝试直接写入剪贴板
            await navigator.clipboard.write([clipboardItem])

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
      // 如果之前是编辑模式，恢复
      if (wasInEditMode) {
        setActiveTab("edit")
      }
    }
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

  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setMarkdown(newContent)
    validateMarkdown(newContent)
  }

  // 根据当前主题获取按钮变体
  const getButtonVariant = (isDark: boolean) => {
    return isDark ? "secondary" : "outline"
  }

  return (
    <main
      className={`min-h-screen transition-colors duration-300 ${theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-black"}`}
    >
      {/* 顶部导航栏 */}
      <header
        className={`sticky top-0 z-10 border-b ${theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"} py-3 px-4 md:px-8`}
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Markdown编辑器</h1>
            <p className="text-sm text-muted-foreground hidden md:block">编辑Markdown并查看实时预览</p>
          </div>
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 rounded-full transition-colors ${theme === "dark" ? "hover:bg-slate-800" : "hover:bg-slate-100"}`}
                  >
                    <Github className="h-5 w-5" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>查看源代码</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="flex items-center gap-1 border rounded-full p-1 px-2">
              <Sun className="h-4 w-4" />
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                className="mx-1"
              />
              <Moon className="h-4 w-4" />
            </div>
          </div>
        </div>
      </header>

      {/* 工具栏 */}
      <div className={`border-b ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`}>
        <div className="container mx-auto py-2 px-4 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
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
                  className={`rounded-none ${showEditor ? "bg-primary text-primary-foreground" : ""}`}
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
                  className={`rounded-none ${!showEditor ? "bg-primary text-primary-foreground" : ""}`}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  预览
                </Button>
              </div>

              <div className="flex items-center gap-1 border rounded-md px-2 py-1">
                <span className="text-sm">自动验证</span>
                <Switch size="sm" checked={autoValidate} onCheckedChange={setAutoValidate} />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("file-upload")?.click()}
                className="flex items-center gap-1"
              >
                <Upload className="h-4 w-4 mr-1" />
                导入Markdown .md
              </Button>
              <input
                id="file-upload"
                type="file"
                accept=".md, .markdown, .txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                disabled={isExporting !== null}
                className="flex items-center gap-1"
              >
                {isExporting === "clipboard" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Clipboard className="h-4 w-4 mr-1" />
                )}
                复制
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={exportAsImage}
                disabled={isExporting !== null}
                className="flex items-center gap-1"
              >
                {isExporting === "image" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <FileImage className="h-4 w-4 mr-1" />
                )}
                保存图片
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={exportAsPDF}
                disabled={isExporting !== null}
                className="flex items-center gap-1"
              >
                {isExporting === "pdf" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <FilePdf className="h-4 w-4 mr-1" />
                )}
                保存PDF
              </Button>

              <Button variant="outline" size="sm" onClick={toggleSettings} className="flex items-center gap-1">
                <Settings className="h-4 w-4 mr-1" />
                设置
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 编辑器和预览区域 */}
      <div className="container mx-auto p-4 md:p-6">
        {/* 移动端标签切换 */}
        <div className="md:hidden mb-4">
          <Tabs defaultValue="edit" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit">编辑</TabsTrigger>
              <TabsTrigger value="preview">预览</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* 主要内容区域 */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* 编辑器区域 - 可以切换显示/隐藏 */}
          {(showEditor || activeTab === "edit") && (
            <div
              className={`${activeTab !== "edit" && "hidden md:block"} ${showEditor ? "md:w-1/2" : "hidden md:hidden"} transition-all duration-300`}
            >
              {/* 编辑器容器 */}
              <div
                className={`relative border rounded-md transition-all h-[calc(100vh-220px)] overflow-hidden ${
                  theme === "dark" ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-slate-50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {/* 编辑器和行号的容器 */}
                <div className="flex h-full relative">
                  {/* 行号显示 */}
                  <div
                    ref={lineNumbersRef}
                    className="w-10 bg-opacity-50 flex-shrink-0 text-xs text-muted-foreground font-mono pt-4 pb-8 text-right pr-2 overflow-hidden"
                    style={{ height: "100%", overflowY: "hidden" }}
                  >
                    {Array.from({ length: lineCount }).map((_, i) => (
                      <div key={i} className="leading-6 h-6">
                        {i + 1}
                      </div>
                    ))}
                  </div>

                  {/* 文本编辑区域 */}
                  <Textarea
                    ref={editorRef}
                    value={markdown}
                    onChange={handleMarkdownChange}
                    className={`h-full w-full font-mono resize-none border-0 rounded-md p-4 pl-2 ${
                      theme === "dark"
                        ? "bg-slate-800 text-slate-100 placeholder:text-slate-400"
                        : "bg-slate-50 placeholder:text-slate-400"
                    }`}
                    placeholder="在此处输入或粘贴您的Markdown，或拖放.md文件到此处..."
                    style={{ lineHeight: "1.5rem" }}
                  />
                </div>

                {/* 拖放提示 */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <div
                    className={`p-3 rounded-lg ${theme === "dark" ? "bg-slate-800" : "bg-white"} shadow-lg border border-dashed ${theme === "dark" ? "border-slate-600" : "border-slate-300"} opacity-90`}
                  >
                    <p className="text-center">拖放Markdown文件到此处</p>
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
              className={`border rounded-md overflow-auto transition-all h-[calc(100vh-220px)] ${
                isFullscreen ? "fixed inset-0 z-50 p-8" : ""
              } ${theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}
            >
              <div
                ref={previewRef}
                className={`markdown-preview ${theme === "dark" ? "dark" : ""} theme-${themeStyle} p-6`}
                style={{ fontSize: `${fontSize}px` }}
              >
                <MarkdownPreview markdown={markdown} themeStyle={themeStyle} />
              </div>
            </div>
          </div>
        </div>

        {/* 设置面板 - 条件渲染 */}
        {showSettings && (
          <Card
            className={`mt-6 transition-all ${theme === "dark" ? "bg-slate-800 border-slate-700 text-slate-100" : ""}`}
          >
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Settings className="h-5 w-5 text-primary" />
                    <h3 className={`text-lg font-medium ${theme === "dark" ? "text-slate-100" : ""}`}>主题与样式</h3>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <Label
                        htmlFor="theme-style-select"
                        className={`mb-2 block ${theme === "dark" ? "text-slate-200" : ""}`}
                      >
                        主题风格
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
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
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <FileDown className="h-5 w-5 text-primary" />
                    <h3 className={`text-lg font-medium ${theme === "dark" ? "text-slate-100" : ""}`}>导出选项</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      onClick={exportAsPDF}
                      className="flex items-center gap-2 transition-all"
                      disabled={isExporting !== null}
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
                      className="flex items-center gap-2 transition-all"
                      disabled={isExporting !== null}
                    >
                      {isExporting === "image" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileImage className="h-4 w-4" />
                      )}
                      导出为PNG
                    </Button>
                    <Button
                      onClick={copyToClipboard}
                      className="flex items-center gap-2 transition-all"
                      disabled={isExporting !== null}
                    >
                      {isExporting === "clipboard" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Clipboard className="h-4 w-4" />
                      )}
                      复制到剪贴板
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <footer
          className={`text-center py-4 mt-6 border-t ${theme === "dark" ? "border-slate-800 text-slate-400" : "border-slate-200 text-muted-foreground"}`}
        >
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-2">
              <p>Markdown转换器 - 轻松保存和分享您的内容</p>
              <div className="flex items-center gap-4">
                <a
                  href="#"
                  className={`text-sm hover:underline ${theme === "dark" ? "text-slate-400 hover:text-slate-300" : ""}`}
                >
                  使用指南
                </a>
                <a
                  href="#"
                  className={`text-sm hover:underline ${theme === "dark" ? "text-slate-400 hover:text-slate-300" : ""}`}
                >
                  关于我们
                </a>
                <a
                  href="#"
                  className={`text-sm hover:underline ${theme === "dark" ? "text-slate-400 hover:text-slate-300" : ""}`}
                >
                  反馈建议
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
      <Toaster />
    </main>
  )
}
