"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { ImageIcon, Upload, MoveHorizontal } from "lucide-react"
import ReactCrop, { type Crop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { useAuth } from "@/context/auth-context"

interface EditablePortraitProps {
  initialSrc: string
  alt: string
  width: number
  height: number
  onPositionChange: (position: "left" | "center" | "right") => void
  currentPosition: "left" | "center" | "right"
  onVisibilityChange?: (visible: boolean) => void
  isVisible?: boolean
}

export default function EditablePortrait({
  initialSrc,
  alt,
  width,
  height,
  onPositionChange,
  currentPosition,
  onVisibilityChange,
  isVisible = true,
}: EditablePortraitProps) {
  const { user } = useAuth()
  const isAdmin = user?.isAdmin

  // Use picsum.photos as the default image if src is empty or placeholder
  const defaultImage = `https://picsum.photos/${width}/${height}`
  const [imageSrc, setImageSrc] = useState(
    initialSrc && !initialSrc.includes("placeholder.svg") ? initialSrc : defaultImage,
  )
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState("upload")
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    width: 50,
    height: 50,
    x: 25,
    y: 25,
  })
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null)
  const [bgRemovalStrength, setBgRemovalStrength] = useState(50)
  const imgRef = useRef<HTMLImageElement>(null)

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
      setActiveTab("crop")
    }
  }

  const handleSave = () => {
    if (selectedFile && completedCrop) {
      // In a real app, you would process the crop and background removal here
      // For now, we'll just use the preview URL
      setImageSrc(previewUrl || defaultImage)
      setIsOpen(false)
      setSelectedFile(null)
      setPreviewUrl(null)
    } else if (selectedFile) {
      setImageSrc(previewUrl || defaultImage)
      setIsOpen(false)
      setSelectedFile(null)
      setPreviewUrl(null)
    }
  }

  // Function to use default image from picsum
  const useDefaultImage = () => {
    fetch("https://picsum.photos/350/500")
      .then((response) => {
        return response.blob()
      })
      .then((blob) => {
        const defaultFile = new File([blob], "default-image.jpg", { type: "image/jpeg" })
        setSelectedFile(defaultFile)

        const reader = new FileReader()
        reader.onload = () => {
          setPreviewUrl(reader.result as string)
        }
        reader.readAsDataURL(defaultFile)
        setActiveTab("crop")
      })
      .catch((error) => {
        console.error("Error fetching default image:", error)
      })
  }

  const handleError = () => {
    if (imageSrc !== defaultImage) {
      setImageSrc(defaultImage)
    }
  }

  return (
    <div className="group relative">
      <div className="relative">
        <Image
          src={imageSrc || "/placeholder.svg"}
          alt={alt}
          width={width}
          height={height}
          className="object-cover"
          onError={handleError}
        />
        {isAdmin && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              onClick={() => setIsOpen(true)}
              variant="secondary"
              size="icon"
              className="bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800 rounded-full"
              aria-label="Edit portrait"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Portrait</DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="crop">Crop</TabsTrigger>
              <TabsTrigger value="position">Position</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div
                className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                {previewUrl ? (
                  <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="max-h-[300px] object-contain" />
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-gray-400 mb-2" />
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
            </TabsContent>

            <TabsContent value="crop" className="space-y-4">
              {previewUrl && (
                <div className="flex flex-col items-center">
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={3 / 4}
                  >
                    <img
                      ref={imgRef}
                      src={previewUrl || "/placeholder.svg"}
                      alt="Crop preview"
                      className="max-h-[400px] object-contain"
                    />
                  </ReactCrop>

                  <div className="w-full mt-4 space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Background Removal Strength</p>
                      <Slider
                        value={[bgRemovalStrength]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(value) => setBgRemovalStrength(value[0])}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>None</span>
                        <span>Full</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500">
                      Note: In a production environment, this would use an actual background removal API. For this demo,
                      we're simulating the functionality.
                    </p>
                  </div>
                </div>
              )}

              {!previewUrl && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Please upload an image first</p>
                  <Button variant="outline" onClick={() => setActiveTab("upload")} className="mt-4">
                    Go to Upload
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="position" className="space-y-4">
              <div className="space-y-4">
                <p className="text-sm font-medium">Portrait Position</p>

                <div className="grid grid-cols-3 gap-4">
                  <Button
                    variant={currentPosition === "left" ? "default" : "outline"}
                    onClick={() => onPositionChange("left")}
                    className="flex flex-col items-center justify-center h-24"
                  >
                    <div className="relative w-16 h-16 border border-gray-300 rounded-md mb-2">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-gray-400 rounded-sm"></div>
                    </div>
                    <span className="text-xs">Left</span>
                  </Button>

                  <Button
                    variant={currentPosition === "center" ? "default" : "outline"}
                    onClick={() => onPositionChange("center")}
                    className="flex flex-col items-center justify-center h-24"
                  >
                    <div className="relative w-16 h-16 border border-gray-300 rounded-md mb-2">
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 bg-gray-400 rounded-sm"></div>
                    </div>
                    <span className="text-xs">Center</span>
                  </Button>

                  <Button
                    variant={currentPosition === "right" ? "default" : "outline"}
                    onClick={() => onPositionChange("right")}
                    className="flex flex-col items-center justify-center h-24"
                  >
                    <div className="relative w-16 h-16 border border-gray-300 rounded-md mb-2">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-gray-400 rounded-sm"></div>
                    </div>
                    <span className="text-xs">Right</span>
                  </Button>
                </div>

                <div className="flex items-center justify-center mt-4">
                  <MoveHorizontal className="h-5 w-5 text-gray-400 mr-2" />
                  <p className="text-sm text-gray-500">Choose where your portrait appears in relation to the text</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

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
    </div>
  )
}
