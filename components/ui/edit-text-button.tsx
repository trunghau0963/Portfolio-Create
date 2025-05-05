"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { motion } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EditTextButtonProps {
  initialText: string
  initialFontSize?: number
  initialFontFamily?: string
  onSave: (text: string, fontSize?: number, fontFamily?: string) => void
}

const fontFamilies = [
  { value: "font-sans", label: "Sans Serif" },
  { value: "font-serif", label: "Serif" },
  { value: "font-mono", label: "Monospace" },
  { value: "font-display", label: "Display" },
  { value: "font-handwriting", label: "Handwriting" },
  { value: "font-condensed", label: "Condensed" },
  { value: "font-rounded", label: "Rounded" },
  { value: "font-slab", label: "Slab Serif" },
]

export default function EditTextButton({
  initialText,
  initialFontSize = 16,
  initialFontFamily = "font-sans",
  onSave,
}: EditTextButtonProps) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(initialText)
  const [fontSize, setFontSize] = useState(initialFontSize)
  const [fontFamily, setFontFamily] = useState(initialFontFamily)

  // Calculate responsive font sizes for preview
  const tabletFontSize = Math.max(fontSize * 0.85, 12)
  const mobileFontSize = Math.max(fontSize * 0.7, 10)

  const handleSave = () => {
    onSave(text, fontSize, fontFamily)
    setOpen(false)
  }

  return (
    <>
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-gray-600 bg-white/80 hover:bg-white/90 backdrop-blur-sm rounded-full p-1"
          onClick={() => setOpen(true)}
        >
          <Pencil size={16} />
          <span className="sr-only">Edit text</span>
        </Button>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Text</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="text">Text Content</Label>
              <Input id="text" value={text} onChange={(e) => setText(e.target.value)} className="col-span-3" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="font-family">Font Family</Label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger id="font-family">
                  <SelectValue placeholder="Select font family" />
                </SelectTrigger>
                <SelectContent>
                  {fontFamilies.map((font) => (
                    <SelectItem key={font.value} value={font.value} className={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <div className="flex justify-between">
                <Label htmlFor="font-size">Font Size: {fontSize}px</Label>
                <span className="text-xs text-gray-500">
                  Responsive: ~{tabletFontSize.toFixed(0)}px (tablet), ~{mobileFontSize.toFixed(0)}px (mobile)
                </span>
              </div>
              <Slider
                id="font-size"
                min={10}
                max={120}
                step={1}
                value={[fontSize]}
                onValueChange={(value) => setFontSize(value[0])}
              />
            </div>

            {/* <div className="mt-2 p-4 border rounded-md">
              <p className="text-sm text-gray-500 mb-2">Preview:</p>
              <div className={`${fontFamily} break-words-safe`} style={{ fontSize: `${fontSize}px` }}>
                {text || "Preview text"}
              </div>
            </div> */}
          </div>
          <DialogFooter>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button onClick={handleSave}>Save Changes</Button>
            </motion.div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
