"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import EditImageButton from "./edit-image-button";
import ResponsiveImage from "./responsive-image";
import { getPlaceholderImage } from "@/utils/image-utils";

interface EditableImageProps {
  src: string; // Cloudinary URL or placeholder
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  // imageId is no longer strictly needed here if parent handles identification
  // onSave is replaced by onImageUploaded, which passes Cloudinary data to parent
  onImageUploaded?: (imageData: {
    public_id: string;
    secure_url: string;
  }) => Promise<void>;
  // Add uploadPreset from Cloudinary dashboard
  uploadPreset: string;
  isLockButton?: boolean;
}

export default function EditableImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  sizes,
  onImageUploaded,
  uploadPreset, // Destructure
  isLockButton = false,
}: EditableImageProps) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;

  const defaultImage =
    src && !src.includes("placeholder.svg")
      ? src
      : getPlaceholderImage(width, height);

  const [currentSrc, setCurrentSrc] = useState(defaultImage);
  const [currentAlt, setCurrentAlt] = useState(alt);
  const [isProcessing, setIsProcessing] = useState(false); // For parent's API call after upload

  useEffect(() => {
    const newDefault =
      src && !src.includes("placeholder.svg")
        ? src
        : getPlaceholderImage(width, height);
    setCurrentSrc(newDefault);
    setCurrentAlt(alt); // Update alt if prop changes
  }, [src, alt, width, height]);

  const handleUploadSuccess = async (imageData: {
    public_id: string;
    secure_url: string;
  }) => {
    if (onImageUploaded) {
      setIsProcessing(true);
      try {
        await onImageUploaded(imageData);
        // Parent is responsible for updating src/alt via props after successful save
        // setCurrentSrc(imageData.secure_url); // Optionally update immediately, or wait for prop change
      } catch (error) {
        console.error("Error in onImageUploaded callback:", error);
        // Toast error is likely handled by EditImageButton or parent
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleError = () => {
    console.error(`Failed to load image: ${currentSrc}`);
    setCurrentSrc(getPlaceholderImage(width, height));
  };

  return (
    <div className="group relative">
      <ResponsiveImage
        src={currentSrc}
        alt={currentAlt} // Use currentAlt state
        width={width}
        height={height}
        className={className}
        onError={handleError}
        priority={priority}
        sizes={sizes}
      />
      {isAdmin && onImageUploaded && uploadPreset && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isLockButton && (
            <EditImageButton
              onUploadSuccess={handleUploadSuccess}
              uploadPreset={uploadPreset} // Pass the preset
              isSaving={isProcessing} // Pass parent's saving state
            />
          )}
        </div>
      )}
    </div>
  );
}
