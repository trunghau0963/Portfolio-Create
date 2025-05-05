"use client"
import { CldUploadWidget } from "next-cloudinary";
import { useState } from "react"
import Image from "next/image"
import EditImageButton from "./edit-image-button"
import { useAuth } from "@/context/auth-context"

interface EditableImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
}

export default function EditableImage({ src, alt, width, height, className = "" }: EditableImageProps) {
  const { user } = useAuth()
  const isAdmin = user?.isAdmin

  // Use picsum.photos as the default image if src is empty or placeholder
  const defaultImage = `https://picsum.photos/${width}/${height}`
  const [imageSrc, setImageSrc] = useState(src && !src.includes("placeholder.svg") ? src : defaultImage)

  const handleSave = (file: File) => {
    // Create a temporary URL for the uploaded file
    const newImageUrl = URL.createObjectURL(file)
    setImageSrc(newImageUrl)

    // In the future, this is where you would upload to storage and save the URL to the database
    console.log("Saving image:", file.name)
  }

  const handleError = () => {
    // If image fails to load, use the default image
    if (imageSrc !== defaultImage) {
      setImageSrc(defaultImage)
    }
  }

  return (
    <div className="group relative">
      <Image
        src={imageSrc || "/placeholder.svg"}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={handleError}
      />
      {isAdmin && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <EditImageButton onSave={handleSave} />
        </div>
      )}
    </div>
  )
}
