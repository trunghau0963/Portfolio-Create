"use client"

import type React from "react"

import { useState } from "react"
import EditTextButton from "./edit-text-button"
import { useAuth } from "@/context/auth-context"

interface EditableTextProps {
  initialText: string
  className?: string
  as?: React.ElementType
  initialFontSize?: number
  initialFontFamily?: string
}

export default function EditableText({
  initialText,
  className = "",
  as: Component = "p",
  initialFontSize = 16,
  initialFontFamily = "font-sans",
}: EditableTextProps) {
  const { user } = useAuth()
  const isAdmin = user?.isAdmin
  const [text, setText] = useState(initialText)
  const [fontSize, setFontSize] = useState(initialFontSize)
  const [fontFamily, setFontFamily] = useState(initialFontFamily)

  const handleSave = (newText: string, newFontSize?: number, newFontFamily?: string) => {
    setText(newText)
    if (newFontSize) setFontSize(newFontSize)
    if (newFontFamily) setFontFamily(newFontFamily)
    // In the future, this is where you would save to the database
    console.log("Saving text:", newText, "Font size:", newFontSize, "Font family:", newFontFamily)
  }

  // Combine the original className without any text-[size] classes
  const filteredClassName = className.replace(/text-\[\d+px\]/g, "").trim()
  const combinedClassName = `${filteredClassName} ${fontFamily}`.trim()

  return (
    <div className="group relative">
      <Component
        className={combinedClassName}
        style={{
          fontSize: `${fontSize}px`,
          "--base-font-size": `${fontSize}px`,
        }}
      >
        {text}
      </Component>
      {isAdmin && (
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <EditTextButton
            initialText={text}
            initialFontSize={fontSize}
            initialFontFamily={fontFamily}
            onSave={handleSave}
          />
        </div>
      )}
    </div>
  )
}
