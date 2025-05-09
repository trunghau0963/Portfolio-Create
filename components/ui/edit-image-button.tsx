"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, Loader2 } from "lucide-react";
import {
  CldUploadWidget,
  type CloudinaryUploadWidgetResults,
} from "next-cloudinary";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface EditImageButtonProps {
  // Removed initialSrc and initialAlt as widget handles preview
  // onSave now receives Cloudinary result and potentially new alt
  onUploadSuccess: (result: {
    public_id: string;
    secure_url: string;
  }) => Promise<void>;
  uploadPreset: string; // Pass the unsigned upload preset name
  isSaving?: boolean; // Keep isSaving if parent manages loading state during API call after upload
}

export default function EditImageButton({
  onUploadSuccess,
  uploadPreset,
  isSaving = false,
}: EditImageButtonProps) {
  const [isUploading, setIsUploading] = useState(false); // Internal loading state for widget

  const handleSuccess = (results: CloudinaryUploadWidgetResults) => {
    setIsUploading(false);
    if (
      results?.info &&
      typeof results.info !== "string" &&
      results.info.public_id
    ) {
      console.log("Cloudinary Upload Result:", results.info);
      const imageData = {
        public_id: results.info.public_id,
        secure_url: results.info.secure_url,
        // Include other potentially useful info if needed, like width, height
      };
      // Call the parent's handler to save this info to the backend
      onUploadSuccess(imageData).catch((err) => {
        console.error("Error in onUploadSuccess callback:", err);
        toast.error("Failed to process image upload.");
      });
    } else {
      console.error(
        "Cloudinary upload succeeded but result info is missing or invalid:",
        results
      );
      toast.error("Upload completed but failed to get image details.");
    }
  };

  const handleError = (error: any) => {
    setIsUploading(false);
    console.error("Cloudinary Upload Error:", error);
    toast.error(`Image upload failed: ${error?.message || "Unknown error"}`);
  };

  return (
    <CldUploadWidget
      uploadPreset={uploadPreset}
      options={
        {
          // sources: ['local', 'url'], // Optional: restrict sources
          // multiple: false, // Optional: allow only single file upload
          // maxFiles: 1,
          // folder: 'portfolio_uploads' // Optional: specify folder in Cloudinary
        }
      }
      onSuccess={handleSuccess}
      onError={handleError}
      onClose={() => setIsUploading(false)} // Reset loading on close if no success/error
    >
      {({ open }) => (
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-gray-600 bg-white/80 hover:bg-white/90 backdrop-blur-sm rounded-full p-1"
            onClick={() => {
              if (open) {
                setIsUploading(true); // Set uploading state right before opening
                open(); // Open the widget on click
              } else {
                console.error("Cloudinary 'open' function is undefined.");
                toast.error("Uploader is not available.");
              }
            }}
            disabled={isUploading || isSaving} // Disable if widget is open or parent is saving
            title="Upload New Image"
          >
            {isUploading || isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ImagePlus size={16} />
            )}
            <span className="sr-only">Upload new image</span>
          </Button>
        </motion.div>
      )}
    </CldUploadWidget>
    // Dialog is removed
  );
}
