"use client"

import type React from "react"

import { useState, useRef } from "react"
import { ImageIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface EditImageButtonProps {
  onSave: (file: File) => void
  className?: string
}

export default function EditImageButton({ onSave, className = "" }: EditImageButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    if (selectedFile) {
      onSave(selectedFile)
      setIsOpen(false)
      setSelectedFile(null)
      setPreviewUrl(null)
    }
  }

  // Function to use default image from picsum
  const useDefaultImage = () => {
    // Create a fetch request to get the image from picsum
    fetch("https://picsum.photos/300/200")
      .then((response) => {
        // Convert the response to a blob
        return response.blob()
      })
      .then((blob) => {
        // Create a File object from the blob
        const defaultFile = new File([blob], "default-image.jpg", { type: "image/jpeg" })

        // Save the file
        onSave(defaultFile)
        setIsOpen(false)
      })
      .catch((error) => {
        console.error("Error fetching default image:", error)
      })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`p-1 rounded-full bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800 transition-colors ${className}`}
        aria-label="Edit image"
      >
        <ImageIcon className="h-4 w-4" />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Image</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              {previewUrl ? (
                <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="max-h-[200px] object-contain" />
              ) : (
                <>
                  <ImageIcon className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to select an image or drag and drop</p>
                </>
              )}
            </div>
            {selectedFile && (
              <p className="text-sm text-gray-500">
                Selected file: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </p>
            )}
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={useDefaultImage} className="text-sm">
                Use Random Image
              </Button>
              <div className="text-xs text-gray-500">Or use a random image from Picsum Photos</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!selectedFile}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
