"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { getResponsiveImageUrl, getImageSizes } from "@/utils/image-utils"

interface ResponsiveImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  sizes?: string
  priority?: boolean
  quality?: number
  onLoad?: () => void
  onError?: () => void
}

export default function ResponsiveImage({
  src,
  alt,
  width,
  height,
  className = "",
  sizes,
  priority = false,
  quality = 75,
  onLoad,
  onError,
}: ResponsiveImageProps) {
  const [imageSrc, setImageSrc] = useState(src)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [responsiveUrls, setResponsiveUrls] = useState({
    tiny: "",
    small: "",
    medium: "",
    large: "",
    original: "",
  })

  // Generate responsive image URLs when source changes
  useEffect(() => {
    if (src) {
      setImageSrc(src)
      setResponsiveUrls(getResponsiveImageUrl(src, width, height))
    }
  }, [src, width, height])

  // Handle image loading error
  const handleError = () => {
    if (!isError) {
      setIsError(true)
      const fallbackUrl = `https://picsum.photos/${width}/${height}?random=${Math.floor(Math.random() * 1000)}`
      setImageSrc(fallbackUrl)
      setResponsiveUrls(getResponsiveImageUrl(fallbackUrl, width, height))
      if (onError) onError()
    }
  }

  // Handle image load success
  const handleLoad = () => {
    setIsLoaded(true)
    if (onLoad) onLoad()
  }

  const imageSizes = getImageSizes(sizes)

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && !priority && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ aspectRatio: `${width}/${height}` }}
          aria-hidden="true"
        />
      )}
      <picture>
        <source media="(max-width: 480px)" srcSet={responsiveUrls.tiny} />
        <source media="(max-width: 640px)" srcSet={responsiveUrls.small} />
        <source media="(max-width: 1024px)" srcSet={responsiveUrls.medium} />
        <source media="(min-width: 1025px)" srcSet={responsiveUrls.large} />
        <Image
          src={responsiveUrls.original || imageSrc}
          alt={alt}
          width={width}
          height={height}
          sizes={imageSizes}
          className={`w-full h-auto object-cover transition-opacity duration-300 ${
            isLoaded || priority ? "opacity-100" : "opacity-0"
          } ${className}`}
          onError={handleError}
          onLoad={handleLoad}
          loading={priority ? "eager" : "lazy"}
          quality={quality}
        />
      </picture>
    </div>
  )
}
