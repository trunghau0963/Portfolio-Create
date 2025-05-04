"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

interface EditTextButtonProps {
  initialText: string
  initialFontSize?: number
  onSave: (text: string, fontSize?: number) => void
  className?: string
}

export default function EditTextButton({
  initialText,
  initialFontSize = 16,
  onSave,
  className = "",
}: EditTextButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState(initialText)
  const [fontSize, setFontSize] = useState(initialFontSize)

  const handleSave = () => {
    onSave(text, fontSize)
    setIsOpen(false)
  }

  // Calculate responsive preview size
  const getResponsivePreviewSize = (size: number) => {
    // This is a simplified calculation for preview purposes
    const minSize = Math.max(size * 0.6, 12)
    const maxSize = size
    const currentViewportWidth = typeof window !== "undefined" ? window.innerWidth : 1024
    const baseWidth = 1024 // Base width for calculation

    // Simple responsive calculation for preview
    const scaleFactor = currentViewportWidth < baseWidth ? Math.max(0.6, currentViewportWidth / baseWidth) : 1

    return Math.round(size * scaleFactor)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`p-1 rounded-full bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800 transition-colors ${className}`}
        aria-label="Edit text"
      >
        <Pencil className="h-4 w-4" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Content</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[150px]"
              placeholder="Enter your content here..."
            />

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="font-size">Font Size: {fontSize}px</Label>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Preview: </span>
                  <span style={{ fontSize: `${fontSize}px` }}>Aa</span>
                  <span className="ml-2 text-xs text-gray-400">
                    (Responsive: ~{getResponsivePreviewSize(fontSize)}px on mobile)
                  </span>
                </div>
              </div>
              <Slider
                id="font-size"
                min={8}
                max={128}
                step={1}
                value={[fontSize]}
                onValueChange={(value) => setFontSize(value[0])}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Small (8px)</span>
                <span>Medium (64px)</span>
                <span>Large (128px)</span>
              </div>
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                <p>
                  Font size will automatically scale down on smaller screens while maintaining your selected size on
                  larger screens.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
