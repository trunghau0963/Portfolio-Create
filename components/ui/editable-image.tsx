"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import EditImageButton from "./edit-image-button"
import ResponsiveImage from "./responsive-image"
import { getPlaceholderImage } from "@/utils/image-utils"

interface EditableImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
  sizes?: string
}

export default function EditableImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  sizes,
}: EditableImageProps) {
  const { user } = useAuth()
  const isAdmin = user?.isAdmin

  // Use a placeholder image if src is empty or contains placeholder.svg
  const defaultImage = src && !src.includes("placeholder.svg") ? src : getPlaceholderImage(width, height)

  const [imageSrc, setImageSrc] = useState(defaultImage)

  const handleSave = (file: File) => {
    // Create a temporary URL for the uploaded file
    const newImageUrl = URL.createObjectURL(file)
    setImageSrc(newImageUrl)

    // In the future, this is where you would upload to storage and save the URL to the database
    console.log("Saving image:", file.name)
  }

  const handleError = () => {
    // If image fails to load, use a fallback placeholder
    console.error(`Failed to load image: ${imageSrc}`)
    setImageSrc(`https://picsum.photos/${width}/${height}?random=${Math.floor(Math.random() * 1000)}`)
  }

  return (
    <div className="group relative">
      <ResponsiveImage
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={handleError}
        priority={priority}
        sizes={sizes}
      />
      {isAdmin && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <EditImageButton onSave={handleSave} />
        </div>
      )}
    </div>
  )
}
