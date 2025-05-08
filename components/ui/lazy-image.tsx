"use client";

import { useState, useEffect } from "react";
import Image, { type ImageProps } from "next/image";
import { getResponsiveImageUrl } from "@/utils/image-utils";

interface LazyImageProps extends Omit<ImageProps, "src" | "blurDataURL"> {
  src: string;
  blurSrc?: string;
  placeholderColor?: string;
}

export default function LazyImage({
  src,
  blurSrc,
  alt,
  width,
  height,
  className = "",
  placeholderColor = "#f3f4f6", // gray-100
  ...props
}: LazyImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState(src);
  const [blurDataUrl, setBlurDataUrl] = useState(blurSrc);

  useEffect(() => {
    // Generate a low-quality placeholder if not provided
    if (!blurSrc && width && height) {
      const numericWidth = Number(width);
      const numericHeight = Number(height);
      const { small } = getResponsiveImageUrl(
        src,
        Math.min(numericWidth, 20),
        Math.min(numericHeight, 20)
      );
      setBlurDataUrl(small);
    }
  }, [src, blurSrc, width, height]);

  return (
    <div
      className="relative overflow-hidden"
      style={{ backgroundColor: placeholderColor }}
    >
      {isLoading && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            backgroundColor: placeholderColor,
          }}
        />
      )}
      <Image
        {...props}
        src={imageSrc || "/placeholder.svg"}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-500 ${
          isLoading ? "opacity-0" : "opacity-100"
        } ${className}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setImageSrc(
            `https://picsum.photos/${width}/${height}?random=${Math.floor(
              Math.random() * 1000
            )}`
          );
        }}
        loading="lazy"
        placeholder={blurDataUrl ? "blur" : "empty"}
        blurDataURL={blurDataUrl}
      />
    </div>
  );
}
