"use client"

import { useState } from "react"
import EditTextButton from "./edit-text-button"
import { useAuth } from "@/context/auth-context"

interface EditableTextAutoResizeProps {
  initialText: string
  className?: string
  as?: "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span" | "div"
}

export default function EditableTextAutoResize({ initialText, className = "", as = "p" }: EditableTextAutoResizeProps) {
  const { user } = useAuth()
  const isAdmin = user?.isAdmin
  const [text, setText] = useState(initialText)

  const handleSave = (newText: string) => {
    setText(newText)
    // In the future, this is where you would save to the database
    console.log("Saving text:", newText)
  }

  const Component = as

  return (
    <div className="group relative">
      <Component className={className}>{text}</Component>
      {isAdmin && (
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <EditTextButton initialText={text} onSave={handleSave} />
        </div>
      )}
    </div>
  )
}
