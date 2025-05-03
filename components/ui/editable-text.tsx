"use client"

import type React from "react"

import { useState } from "react"
import EditTextButton from "./edit-text-button"
import { useAuth } from "@/context/auth-context"

// Add fontSize prop to the component props
interface EditableTextProps {
  initialText: string
  className?: string
  as?: React.ElementType
  initialFontSize?: number
}

// Update the component to use the fontSize prop
export default function EditableText({
  initialText,
  className = "",
  as: Component = "p",
  initialFontSize = 16,
}: EditableTextProps) {
  const { user } = useAuth()
  const isAdmin = user?.isAdmin
  const [text, setText] = useState(initialText)
  const [isEditing, setIsEditing] = useState(false)
  const [fontSize, setFontSize] = useState(initialFontSize)

  const handleSave = (newText: string, newFontSize?: number) => {
    setText(newText)
    if (newFontSize) setFontSize(newFontSize)
    // In the future, this is where you would save to the database
    console.log("Saving text:", newText, "Font size:", newFontSize)
  }

  // Combine the original className with the dynamic font size
  const combinedClassName = `${className} text-[${fontSize}px]`.trim()

  return (
    <div className="group relative">
      <Component className={combinedClassName} style={{ fontSize: `${fontSize}px` }}>
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

// Helper function to extract default font size from className or element type
function getDefaultFontSize(element: string, className: string): number {
  // Try to extract font size from className (e.g., "text-sm", "text-lg", etc.)
  if (className.includes("text-xs")) return 12
  if (className.includes("text-sm")) return 14
  if (className.includes("text-base")) return 16
  if (className.includes("text-lg")) return 18
  if (className.includes("text-xl")) return 20
  if (className.includes("text-2xl")) return 24
  if (className.includes("text-3xl")) return 30
  if (className.includes("text-4xl")) return 36
  if (className.includes("text-5xl")) return 48
  if (className.includes("text-6xl")) return 60
  if (className.includes("text-7xl")) return 72
  if (className.includes("text-8xl")) return 96
  if (className.includes("text-9xl")) return 128

  // Default sizes based on element type
  switch (element) {
    case "h1":
      return 32
    case "h2":
      return 24
    case "h3":
      return 20
    case "h4":
      return 18
    case "h5":
      return 16
    case "h6":
      return 14
    default:
      return 16 // Default for p, div, span
  }
}
