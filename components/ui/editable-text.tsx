"use client"

import type React from "react"

import { useState, useEffect } from "react"
import EditTextButton from "./edit-text-button"
import { useAuth } from "@/context/auth-context"

// Add fontSize prop to the component props
interface EditableTextProps {
  initialText: string
  className?: string
  as?: React.ElementType
  initialFontSize?: number
}

// Update the component to use responsive font sizing
export default function EditableText({
  initialText,
  className = "",
  as: Component = "p",
  initialFontSize = 16,
}: EditableTextProps) {
  const { user } = useAuth()
  const isAdmin = user?.isAdmin
  const [text, setText] = useState(initialText)
  const [fontSize, setFontSize] = useState(initialFontSize)
  const [responsiveStyle, setResponsiveStyle] = useState<React.CSSProperties>({})

  // Calculate responsive font size based on the base font size
  useEffect(() => {
    // Calculate responsive font size using CSS clamp
    // This will scale the font size based on viewport width
    // Format: clamp(min, preferred, max)
    // - min: minimum font size on small screens (60% of base size)
    // - preferred: scales with viewport width
    // - max: maximum font size on large screens (100% of base size)

    const minSize = Math.max(fontSize * 0.6, 12) // Minimum 60% of base size, but not smaller than 12px
    const maxSize = fontSize // Maximum is the selected font size

    // For very large fonts (like headings), use a more aggressive scaling
    if (fontSize > 60) {
      setResponsiveStyle({
        fontSize: `clamp(${minSize}px, ${fontSize * 0.4}px + ${fontSize * 0.5}vw, ${maxSize}px)`,
      })
    } else {
      // For normal text, use a gentler scaling
      setResponsiveStyle({
        fontSize: `clamp(${minSize}px, ${fontSize * 0.7}px + ${fontSize * 0.2}vw, ${maxSize}px)`,
      })
    }
  }, [fontSize])

  const handleSave = (newText: string, newFontSize?: number) => {
    setText(newText)
    if (newFontSize) setFontSize(newFontSize)
    // In the future, this is where you would save to the database
    console.log("Saving text:", newText, "Font size:", newFontSize)
  }

  // Combine the original className without any text-[size] classes
  const filteredClassName = className.replace(/text-\[\d+px\]/g, "").trim()
  const combinedClassName = filteredClassName

  return (
    <div className="group relative">
      <Component className={combinedClassName} style={responsiveStyle}>
        {text}
      </Component>
      {isAdmin && (
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <EditTextButton initialText={text} initialFontSize={fontSize} onSave={handleSave} />
        </div>
      )}
    </div>
  )
}
