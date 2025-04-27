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
  Maximize2,
  Moon,
  Sun,
  FileDown,
  Clipboard,
  Settings,
  Github,
  BookOpen,
  FileText,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
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
  const { toast } = useToast()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isExporting, setIsExporting] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("edit")
  const [showEditor, setShowEditor] = useState<boolean>(true)
  const [watermarkText, setWatermarkText] = useState<string>("Markdown转换器 | markdown-converter.vercel.app")

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
  const sampleMarkdown = `# 欢迎使用Markdown转换器

## 功能特点
- 将Markdown转换为PDF
- 导出为PNG/JPG图片
- 将渲染内容复制到剪贴板
- 多种主题和自定义选项

## 代码示例
\`\`\`javascript
function greet() {
  console.log("你好，Markdown！");
}
\`\`\`

## 表格示例
| 功能 | 状态 |
|---------|--------|
| PDF导出 | ✅ |
| 图片导出 | ✅ |
| 剪贴板复制 | ✅ |
| 主题 | ✅ |

> 试着粘贴你自己的Markdown内容或ChatGPT回复到这里！
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

    if (savedMarkdown) setMarkdown(savedMarkdown)
    if (savedTheme) setTheme(savedTheme)
    if (savedThemeStyle) setThemeStyle(savedThemeStyle)
    if (savedFontSize) setFontSize(Number.parseInt(savedFontSize, 10))
    if (savedShowEditor !== null) setShowEditor(savedShowEditor === "true")
  }, [])

  // 保存内容和设置到localStorage
  useEffect(() => {
    if (markdown) localStorage.setItem("markdown-content", markdown)
    localStorage.setItem("markdown-theme", theme)
    localStorage.setItem("markdown-theme-style", themeStyle)
    localStorage.setItem("markdown-font-size", fontSize.toString())
    localStorage.setItem("markdown-show-editor", showEditor.toString())
  }, [markdown, theme, themeStyle, fontSize, showEditor])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setMarkdown(content)
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
    }
  }

  const exportAsImage = async () => {
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
    }
  }

  const copyToClipboard = async () => {
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

      canvasWithWatermark.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])

            toast({
              title: "已复制到剪贴板",
              description: "图片已复制到您的剪贴板。您现在可以将其粘贴到任何地方。",
            })
          } catch (error) {
            toast({
              title: "复制失败",
              description: "复制到剪贴板时出现错误。您的浏览器可能不支持此功能。",
              variant: "destructive",
            })
          } finally {
            setIsExporting(null)
          }
        }
      })
    } catch (error) {
      toast({
        title: "复制失败",
        description: "生成图片时出现错误。",
        variant: "destructive",
      })
      setIsExporting(null)
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const toggleEditor = () => {
    setShowEditor(!showEditor)
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
            <h1 className="text-xl font-bold">Markdown转换器</h1>
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

        {/* 编辑器和预览区域 */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* 编辑器区域 - 可以切换显示/隐藏 */}
          {(showEditor || activeTab === "edit") && (
            <div className={`${activeTab !== "edit" && "hidden md:block"} ${showEditor ? "md:w-1/2" : "md:w-full"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">编辑器</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={getButtonVariant(theme === "dark")}
                    size="sm"
                    onClick={() => document.getElementById("file-upload")?.click()}
                    className={`transition-all ${theme === "dark" ? "border-slate-700 hover:bg-slate-800" : ""}`}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    上传文件
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".md, .markdown, .txt"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
              <div
                className={`relative border rounded-md transition-all ${
                  theme === "dark" ? "border-slate-700" : "border-slate-200"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Textarea
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  className={`min-h-[500px] font-mono resize-none border-0 rounded-md ${
                    theme === "dark" ? "bg-slate-800 text-slate-100 placeholder:text-slate-400" : ""
                  }`}
                  placeholder="在此处输入或粘贴您的Markdown，或拖放.md文件到此处..."
                />
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
          <div className={`${activeTab !== "preview" && "hidden md:block"} ${showEditor ? "md:w-1/2" : "md:w-full"}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">预览</h2>
              </div>
              <div className="flex items-center gap-2">
                {/* 编辑器显示/隐藏按钮 */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={getButtonVariant(theme === "dark")}
                        size="sm"
                        onClick={toggleEditor}
                        className={`hidden md:flex transition-all ${theme === "dark" ? "border-slate-700 hover:bg-slate-800" : ""}`}
                      >
                        {showEditor ? (
                          <>
                            <PanelLeftClose className="h-4 w-4 mr-2" />
                            隐藏编辑器
                          </>
                        ) : (
                          <>
                            <PanelLeftOpen className="h-4 w-4 mr-2" />
                            显示编辑器
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{showEditor ? "隐藏编辑器以获得更大的预览空间" : "显示编辑器以编辑内容"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button
                  variant={getButtonVariant(theme === "dark")}
                  size="sm"
                  onClick={toggleFullscreen}
                  className={`transition-all ${theme === "dark" ? "border-slate-700 hover:bg-slate-800" : ""}`}
                >
                  <Maximize2 className="h-4 w-4 mr-2" />
                  {isFullscreen ? "退出全屏" : "全屏"}
                </Button>
              </div>
            </div>
            <div
              className={`border rounded-md p-6 overflow-auto transition-all ${
                isFullscreen ? "fixed inset-0 z-50 p-8" : "min-h-[500px] max-h-[500px]"
              } ${theme === "dark" ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"}`}
            >
              <div
                ref={previewRef}
                className={`markdown-preview ${theme === "dark" ? "dark" : ""} theme-${themeStyle}`}
                style={{ fontSize: `${fontSize}px` }}
              >
                <MarkdownPreview markdown={markdown} themeStyle={themeStyle} />
              </div>
            </div>
          </div>
        </div>

        {/* 设置和导出选项 */}
        <Card
          className={`mb-6 transition-all ${theme === "dark" ? "bg-slate-800 border-slate-700 text-slate-100" : ""}`}
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
                          <ThemePreview themeName={style} isDark={theme === "dark"} isSelected={themeStyle === style} />
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

        <footer
          className={`text-center py-4 border-t ${theme === "dark" ? "border-slate-800 text-slate-400" : "border-slate-200 text-muted-foreground"}`}
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
