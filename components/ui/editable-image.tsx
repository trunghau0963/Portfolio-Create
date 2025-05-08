"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import EditImageButton from "./edit-image-button";
import ResponsiveImage from "./responsive-image";
import { getPlaceholderImage } from "@/utils/image-utils";

interface EditableImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  imageId?: string; // Optional: ID for saving
  onSave?: (data: { src?: string; alt?: string }) => Promise<void>; // Optional: Save callback
}

export default function EditableImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  sizes,
  imageId, // Destructure
  onSave, // Destructure
}: EditableImageProps) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;

  // Use a placeholder image if src is empty or contains placeholder.svg
  const defaultImage =
    src && !src.includes("placeholder.svg")
      ? src
      : getPlaceholderImage(width, height);

  const [imageSrc, setImageSrc] = useState(defaultImage);
  const [imageAlt, setImageAlt] = useState(alt);
  const [isSaving, setIsSaving] = useState(false);

  // Update local state if props change (e.g., after save and data refresh)
  useEffect(() => {
    const newDefault =
      src && !src.includes("placeholder.svg")
        ? src
        : getPlaceholderImage(width, height);
    setImageSrc(newDefault);
    setImageAlt(alt);
  }, [src, alt, width, height]);

  const handleInternalSave = async (newSrc?: string, newAlt?: string) => {
    if (!imageId || !onSave) {
      console.log(
        "EditableImage: Missing imageId or onSave prop, cannot save."
      );
      // Optionally update preview locally even if save isn't possible
      if (newSrc !== undefined) setImageSrc(newSrc);
      if (newAlt !== undefined) setImageAlt(newAlt);
      return;
    }

    const updateData: { src?: string; alt?: string } = {};
    if (newSrc !== undefined && newSrc !== imageSrc) updateData.src = newSrc;
    if (newAlt !== undefined && newAlt !== imageAlt) updateData.alt = newAlt;

    if (Object.keys(updateData).length === 0) {
      console.log("EditableImage: No changes detected.");
      return; // No changes to save
    }

    setIsSaving(true);
    try {
      await onSave(updateData);
      // Update local state after successful save (or rely on parent re-fetch)
      if (updateData.src) setImageSrc(updateData.src);
      if (updateData.alt) setImageAlt(updateData.alt);
      console.log("Image saved via onSave:", imageId, updateData);
    } catch (error) {
      console.error("Error saving image via onSave:", error);
      // Handle error (e.g., show toast)
    } finally {
      setIsSaving(false);
    }
  };

  const handleError = () => {
    // If image fails to load, use a fallback placeholder
    console.error(`Failed to load image: ${imageSrc}`);
    setImageSrc(getPlaceholderImage(width, height));
  };

  return (
    <div className="group relative">
      <ResponsiveImage
        src={imageSrc}
        alt={imageAlt}
        width={width}
        height={height}
        className={className}
        onError={handleError}
        priority={priority}
        sizes={sizes}
      />
      {isAdmin && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <EditImageButton
            initialSrc={imageSrc}
            initialAlt={imageAlt}
            onSave={handleInternalSave}
            isSaving={isSaving}
          />
        </div>
      )}
    </div>
  );
}
