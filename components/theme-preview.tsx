import type React from "react"
import { Check } from "lucide-react"

interface ThemePreviewProps {
  themeName: string
  isDark: boolean
  isSelected: boolean
}

const ThemePreview: React.FC<ThemePreviewProps> = ({ themeName, isDark, isSelected }) => {
  // 根据主题名称和暗色/亮色模式获取预览样式
  const getPreviewStyle = () => {
    if (isDark) {
      switch (themeName) {
        case "github":
          return { bg: "bg-[#0d1117]", text: "text-gray-200", heading: "text-gray-100", accent: "bg-[#1f6feb]" }
        case "notion":
          return { bg: "bg-[#2f3437]", text: "text-gray-300", heading: "text-gray-100", accent: "bg-[#37352f]" }
        case "chatgpt":
          return { bg: "bg-[#343541]", text: "text-gray-300", heading: "text-gray-100", accent: "bg-[#10a37f]" }
        default:
          return { bg: "bg-slate-900", text: "text-slate-300", heading: "text-slate-100", accent: "bg-slate-700" }
      }
    } else {
      switch (themeName) {
        case "github":
          return { bg: "bg-white", text: "text-gray-700", heading: "text-gray-900", accent: "bg-[#0969da]" }
        case "notion":
          return { bg: "bg-white", text: "text-gray-700", heading: "text-gray-900", accent: "bg-[#e3e2e0]" }
        case "chatgpt":
          return { bg: "bg-white", text: "text-gray-700", heading: "text-gray-900", accent: "bg-[#10a37f]" }
        default:
          return { bg: "bg-white", text: "text-gray-700", heading: "text-gray-900", accent: "bg-gray-200" }
      }
    }
  }

  const style = getPreviewStyle()

  // 获取主题名称的中文显示
  const getThemeNameChinese = () => {
    switch (themeName) {
      case "github":
        return "GitHub"
      case "notion":
        return "Notion"
      case "chatgpt":
        return "ChatGPT"
      default:
        return "默认"
    }
  }

  return (
    <div className="relative">
      <div className={`${style.bg} p-2 h-20 w-full`}>
        <div className={`${style.heading} text-xs font-bold mb-1`}>{getThemeNameChinese()}</div>
        <div className={`${style.text} text-[8px] mb-2`}>Markdown预览样式</div>
        <div className="flex gap-1 items-center">
          <div className={`${style.accent} h-1 w-6 rounded-sm`}></div>
          <div className={`${style.accent} h-1 w-3 rounded-sm opacity-70`}></div>
        </div>
      </div>
      {isSelected && (
        <div className="absolute top-1 right-1 bg-primary rounded-full p-0.5">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
    </div>
  )
}

export default ThemePreview
