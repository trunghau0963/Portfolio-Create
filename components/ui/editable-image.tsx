"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
// import EditImageButton from "./edit-image-button" // Will be removed
import ResponsiveImage from "./responsive-image";
import { getPlaceholderImage } from "@/utils/image-utils";
import { Button } from "@/components/ui/button"; // For Save/Cancel
import { Input } from "@/components/ui/input"; // For inline editing
import { Label } from "@/components/ui/label"; // For input labels
import { Pencil } from "lucide-react"; // For edit icon

interface EditableImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  blockId: string; // Added blockId
  onSave: (
    blockId: string,
    newData: { src?: string; alt?: string }
  ) => Promise<void>; // Modified onSave
  className?: string;
  priority?: boolean;
  sizes?: string;
  isAdmin?: boolean; // Added isAdmin prop
}

export default function EditableImage({
  src,
  alt,
  width,
  height,
  blockId,
  onSave,
  className = "",
  priority = false,
  sizes,
  isAdmin: propIsAdmin, // Renamed to avoid conflict
}: EditableImageProps) {
  const { user } = useAuth();
  const isAdmin = propIsAdmin !== undefined ? propIsAdmin : user?.isAdmin;

  const [isEditing, setIsEditing] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [currentAlt, setCurrentAlt] = useState(alt);
  const [savedSrc, setSavedSrc] = useState(src);
  const [savedAlt, setSavedAlt] = useState(alt);

  // To form a default image, ensure width and height are valid
  const defaultImage = getPlaceholderImage(
    width > 0 ? width : 300,
    height > 0 ? height : 200
  );

  // Update current values if props change
  useEffect(() => {
    const newSrc = src && !src.includes("placeholder.svg") ? src : defaultImage;
    setCurrentSrc(newSrc);
    setSavedSrc(newSrc);
  }, [src, width, height, defaultImage]);

  useEffect(() => {
    setCurrentAlt(alt);
    setSavedAlt(alt);
  }, [alt]);

  const handleSaveClick = async () => {
    try {
      await onSave(blockId, { src: currentSrc, alt: currentAlt });
      setSavedSrc(currentSrc);
      setSavedAlt(currentAlt);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save image block:", error);
      // Optionally, handle error display
    }
  };

  const handleCancelClick = () => {
    setCurrentSrc(savedSrc);
    setCurrentAlt(savedAlt);
    setIsEditing(false);
  };

  const handleError = () => {
    if (currentSrc !== defaultImage) {
      setCurrentSrc(defaultImage);
    }
  };

  if (isEditing) {
    return (
      <div className="w-full p-4 border rounded-md bg-gray-50 dark:bg-gray-800 space-y-3">
        <div>
          <Label
            htmlFor={`image-src-${blockId}`}
            className="text-sm font-medium"
          >
            Image URL
          </Label>
          <Input
            id={`image-src-${blockId}`}
            type="text"
            value={currentSrc}
            onChange={(e) => setCurrentSrc(e.target.value)}
            className="w-full mt-1 dark:text-black"
          />
        </div>
        <div>
          <Label
            htmlFor={`image-alt-${blockId}`}
            className="text-sm font-medium"
          >
            Alt Text
          </Label>
          <Input
            id={`image-alt-${blockId}`}
            type="text"
            value={currentAlt}
            onChange={(e) => setCurrentAlt(e.target.value)}
            className="w-full mt-1 dark:text-black"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={handleCancelClick}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSaveClick}>
            Save Image
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <ResponsiveImage
        src={currentSrc} // Display currentSrc
        alt={currentAlt} // Display currentAlt
        width={width}
        height={height}
        className={className}
        onError={handleError} // Keep existing error handling
        priority={priority}
        sizes={sizes}
      />
      {isAdmin && !isEditing && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-blue-500 hover:text-blue-700 bg-white/70 rounded-full p-1"
          onClick={() => setIsEditing(true)}
        >
          <Pencil size={16} />
        </Button>
      )}
    </div>
  );
}
