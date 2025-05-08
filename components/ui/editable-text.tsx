"use client";

import type React from "react";
import { useState, useEffect } from "react";
// import EditTextButton from "./edit-text-button"
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";

interface EditableTextProps {
  initialText: string;
  blockId: string;
  onSave: (blockId: string, newText: string) => Promise<void>;
  className?: string;
  as?: React.ElementType;
  initialFontSize?: number;
  initialFontFamily?: string;
  isAdmin?: boolean;
}

export default function EditableText({
  initialText,
  blockId,
  onSave,
  className = "",
  as: Component = "p",
  initialFontSize = 16,
  initialFontFamily = "font-sans",
  isAdmin: propIsAdmin,
}: EditableTextProps) {
  const { user } = useAuth();
  const isAdmin = propIsAdmin !== undefined ? propIsAdmin : user?.isAdmin;

  const [isEditing, setIsEditing] = useState(false);
  const [currentText, setCurrentText] = useState(initialText);
  const [savedText, setSavedText] = useState(initialText);

  useEffect(() => {
    setCurrentText(initialText);
    setSavedText(initialText);
  }, [initialText]);

  const handleSaveClick = async () => {
    try {
      await onSave(blockId, currentText);
      setSavedText(currentText);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save text block:", error);
    }
  };

  const handleCancelClick = () => {
    setCurrentText(savedText);
    setIsEditing(false);
  };

  const filteredClassName = className.replace(/text-\[\d+px\]/g, "").trim();
  const combinedClassName = `${filteredClassName} ${initialFontFamily}`.trim();

  if (isEditing) {
    return (
      <div className="w-full">
        <Textarea
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          className="w-full mb-2 dark:text-black"
          style={{ fontSize: `${initialFontSize}px` }}
          rows={4}
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleCancelClick}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSaveClick}>
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <Component
        className={combinedClassName}
        style={{
          fontSize: `${initialFontSize}px`,
          "--base-font-size": `${initialFontSize}px`,
        }}
      >
        {currentText}
      </Component>
      {isAdmin && !isEditing && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 text-blue-500 hover:text-blue-700"
          onClick={() => setIsEditing(true)}
        >
          <Pencil size={14} />
        </Button>
      )}
    </div>
  );
}
