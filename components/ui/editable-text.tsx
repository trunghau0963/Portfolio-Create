"use client";

import type React from "react";

import { useState, useEffect } from "react";
import EditTextButton from "./edit-text-button";
import { useAuth } from "@/context/auth-context";

interface EditableTextProps {
  initialText: string;
  className?: string;
  as?: React.ElementType;
  initialFontSize?: number;
  initialFontFamily?: string;
  blockId?: string; // Optional: ID of the text block for saving
  onCommitText?: (
    blockId: string,
    newContent: string,
    newFontSize?: number,
    newFontFamily?: string
  ) => Promise<void>;
  isLockButton?: boolean;
}

export default function EditableText({
  initialText,
  className = "",
  as: Component = "p",
  initialFontSize = 16,
  initialFontFamily = "font-sans",
  blockId, // Destructure new prop
  onCommitText, // Destructure new prop
  isLockButton = false,
}: EditableTextProps) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;
  const [text, setText] = useState(initialText);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [fontFamily, setFontFamily] = useState(initialFontFamily);
  const [isSaving, setIsSaving] = useState(false); // Add saving state for feedback

  const handleInternalSave = async (
    newText: string,
    newFontSize?: number,
    newFontFamily?: string
  ) => {
    setText(newText);
    if (newFontSize) setFontSize(newFontSize);
    if (newFontFamily) setFontFamily(newFontFamily);

    if (blockId && onCommitText) {
      setIsSaving(true);
      try {
        await onCommitText(blockId, newText, newFontSize, newFontFamily);
        console.log(
          "Text block saved via onCommitText:",
          blockId,
          newText,
          newFontSize,
          newFontFamily
        );
      } catch (error) {
        console.error("Error saving text block via onCommitText:", error);
      } finally {
        setIsSaving(false);
      }
    } else {
      console.log(
        "Saving text (local/no backend):",
        newText,
        "Font size:",
        newFontSize,
        "Font family:",
        newFontFamily
      );
    }
  };

  // Load initial font size and family from data if available, otherwise use defaults
  useEffect(() => {
    // This assumes initialText might come from a TextBlock that now has fontSize/fontFamily
    // However, initialFontSize and initialFontFamily props are already handling defaults.
    // The state (fontSize, fontFamily) is initialized from these props.
    // If TextBlock data itself is passed and has these fields, they should be part of initialFontSize/initialFontFamily props.
  }, [initialText]); // Re-evaluate if initialText changes to reload font styles, if necessary

  // Combine the original className without any text-[size] classes
  const filteredClassName = className.replace(/text-\[\d+px\]/g, "").trim();
  const combinedClassName = `${filteredClassName} ${fontFamily}`.trim();

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
          {!isLockButton && (
            <EditTextButton
              initialText={text} // Pass current text for editing
              initialFontSize={fontSize}
              initialFontFamily={fontFamily}
              onSave={handleInternalSave} // EditTextButton calls this internal handler
              isSaving={isSaving} // Pass saving state to EditTextButton for UI feedback
            />
          )}
        </div>
      )}
    </div>
  );
}
