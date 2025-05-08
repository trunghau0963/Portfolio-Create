"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

interface EditImageButtonProps {
  initialSrc: string;
  initialAlt: string;
  onSave: (newSrc?: string, newAlt?: string) => Promise<void>;
  isSaving?: boolean;
}

export default function EditImageButton({
  initialSrc,
  initialAlt,
  onSave,
  isSaving = false,
}: EditImageButtonProps) {
  const [open, setOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState(initialSrc);
  const [imageAlt, setImageAlt] = useState(initialAlt);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setImageSrc(loadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const srcChanged = imageSrc !== initialSrc;
    const altChanged = imageAlt !== initialAlt;

    if (srcChanged || altChanged) {
      await onSave(
        srcChanged ? imageSrc : undefined,
        altChanged ? imageAlt : undefined
      );
    }
    setOpen(false);
  };

  useEffect(() => {
    if (open) {
      setImageSrc(initialSrc);
      setImageAlt(initialAlt);
    }
  }, [open, initialSrc, initialAlt]);

  return (
    <>
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-gray-600 bg-white/80 hover:bg-white/90 backdrop-blur-sm rounded-full p-1"
          onClick={() => setOpen(true)}
          disabled={isSaving}
          title="Edit Image"
        >
          <ImagePlus size={16} />
          <span className="sr-only">Edit image</span>
        </Button>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Image</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="img-src">Image URL or Upload</Label>
              {imageSrc && (
                <img
                  src={imageSrc}
                  alt="Current preview"
                  className="max-w-full h-auto max-h-48 rounded border mb-2"
                />
              )}
              <div className="flex gap-2">
                <Input
                  id="img-src"
                  value={imageSrc}
                  onChange={(e) => setImageSrc(e.target.value)}
                  placeholder="Enter image URL"
                  className="flex-grow"
                  disabled={isSaving}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                >
                  Upload
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="img-alt">Alt Text</Label>
              <Input
                id="img-alt"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Descriptive text for accessibility"
                disabled={isSaving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
