"use client";

import EditableText from "../ui/editable-text";
import EditableImage from "../ui/editable-image";
import AnimatedSection from "../ui/animated-section";
import ResumeManager from "../ui/resume-manager";
import EditableTextAutoResize from "../ui/editable-text-auto-resize";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Pencil, ImagePlus, Settings } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Section as PrismaSection,
  TextBlock as PrismaTextBlock,
  ImageBlock as PrismaImageBlock,
} from "../../lib/generated/prisma";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface IntroductionSectionProps {
  section: PrismaSection & {
    textBlocks: PrismaTextBlock[];
    imageBlocks: (PrismaImageBlock & {
      width: number;
      height: number;
    })[];
  };
  onDataChange: () => void;
}

export default function IntroductionSection({
  section,
  onDataChange,
}: IntroductionSectionProps) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;
  const sectionId = section.slug;

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "text" | "image";
    id: string;
  } | null>(null);

  // Add image resize state
  const [isResizeDialogOpen, setIsResizeDialogOpen] = useState(false);
  const [imageWidth, setImageWidth] = useState("300");
  const [imageHeight, setImageHeight] = useState("300");
  const [imageContainer, setImageContainer] = useState({
    width: 300,
    height: 300
  });

  // Fetch image dimensions when component mounts or when data changes
  useEffect(() => {
    if (section.imageBlocks?.[0]) {
      setImageWidth(section.imageBlocks[0].width.toString());
      setImageHeight(section.imageBlocks[0].height.toString());
      setImageContainer({
        width: section.imageBlocks[0].width,
        height: section.imageBlocks[0].height
      });
    }
  }, [section.imageBlocks]);

  const handleSaveImageSize = async () => {
    if (!section.imageBlocks?.[0]) return;

    try {
      const response = await fetch(`/api/imageblocks/${section.imageBlocks[0].id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          width: Number(imageWidth),
          height: Number(imageHeight)
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to update image size");
      }

      // Update container size after successful API call
      setImageContainer({
        width: Number(imageWidth),
        height: Number(imageHeight)
      });
      setIsResizeDialogOpen(false);
      toast.success("Image size updated successfully!");
      onDataChange(); // Refresh the data
    } catch (error) {
      console.error("Error updating image size:", error);
      toast.error("Failed to update image size");
    }
  };

  const handleSaveTextBlock = async (
    blockId: string,
    newContent: string,
    newFontSize?: number,
    newFontFamily?: string
  ) => {
    try {
      const payload: {
        content: string;
        fontSize?: number;
        fontFamily?: string;
      } = { content: newContent };
      if (newFontSize !== undefined) payload.fontSize = newFontSize;
      if (newFontFamily !== undefined) payload.fontFamily = newFontFamily;

      const res = await fetch(`/api/textblocks/${blockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save text block");
      }
      toast.success("Text block saved!");
      onDataChange();
    } catch (error) {
      console.error("Error in handleSaveTextBlock:", error);
      toast.error(`Failed to save text: ${(error as Error).message}`);
    }
  };

  const handleUploadedImageSave = async (
    blockId: string,
    imageData: { public_id: string; secure_url: string }
  ) => {
    try {
      const payload = {
        src: imageData.secure_url,
        imagePublicId: imageData.public_id,
      };
      const res = await fetch(`/api/imageblocks/${blockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save image block");
      }
      toast.success("Image block saved!");
      onDataChange();
    } catch (error) {
      console.error("Error in handleUploadedImageSave:", error);
      toast.error(`Failed to save image: ${(error as Error).message}`);
    }
  };

  const mainTextBlocks = section.textBlocks?.slice(0, 1) || [];
  const sideTextBlock =
    section.textBlocks?.length > 1 ? section.textBlocks[1] : null;
  const mainImageBlock = section.imageBlocks?.[0];

  return (
    <section
      id={sectionId}
      className="shadow-sm dark:shadow-gray-900 dark:shadow-sm py-16 md:py-20 lg:py-24 bg-gray-100"
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-12">
          <AnimatedSection variant="fadeInDown" delay={0.1}>
            <EditableTextAutoResize
              initialText={section.title || "INTRODUCTION"}
              as="h1"
              className="text-red-600 text-5xl sm:text-[80px] md:text-[100px] lg:text-[135px] font-bold leading-none tracking-tighter"
            />
          </AnimatedSection>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          {/* Main Text Block Column */}
          <div className="lg:col-span-1">
            <AnimatedSection variant="fadeInUp" delay={0.3} className="h-full">
              <div className="space-y-6 h-full">
                {mainTextBlocks.map((block) => (
                  <EditableText
                    key={block.id}
                    initialText={block.content || ""}
                    initialFontSize={block.fontSize || 14}
                    initialFontFamily={block.fontFamily || "font-sans"}
                    className="text-gray-700 dark:text-gray-300 leading-relaxed"
                    blockId={block.id}
                    onCommitText={handleSaveTextBlock}
                  />
                ))}
              </div>
            </AnimatedSection>
          </div>

          {/* Side Text Block Column */}
          <div className="lg:col-span-1">
            <AnimatedSection variant="fadeInUp" delay={0.5} className="h-full">
              <div className="space-y-6 h-full">
                {sideTextBlock && (
                  <EditableText
                    key={sideTextBlock.id}
                    initialText={sideTextBlock.content || ""}
                    initialFontSize={sideTextBlock.fontSize || 14}
                    initialFontFamily={sideTextBlock.fontFamily || "font-sans"}
                    className="text-gray-700 dark:text-gray-300 leading-relaxed"
                    blockId={sideTextBlock.id}
                    onCommitText={handleSaveTextBlock}
                  />
                )}
              </div>
            </AnimatedSection>
          </div>

          {/* Main Image Block Column */}
          <div className="lg:col-span-1">
            <AnimatedSection variant="zoomIn" delay={0.7}>
              <div className="relative flex justify-center">
                <div 
                  className="mt-4 relative overflow-hidden rounded-md shadow-md hover:shadow-lg transition-shadow duration-300"
                  style={{
                    width: Math.min(imageContainer.width, 500), // Limit max width
                    height: Math.min(imageContainer.height, 500), // Limit max height
                  }}
                >
                  {mainImageBlock ? (
                    <>
                      <EditableImage
                        key={mainImageBlock.id}
                        src={mainImageBlock.src || "/images/placeholder-introduction.png"}
                        alt={mainImageBlock.alt || "Introduction portrait"}
                        width={imageContainer.width}
                        height={imageContainer.height}
                        className="w-full h-full object-contain"
                        onImageUploaded={(imageData) =>
                          handleUploadedImageSave(
                            String(mainImageBlock.id),
                            imageData
                          )
                        }
                        uploadPreset="portfolio_unsigned"
                      />
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute bottom-2 right-2 bg-white/80 hover:bg-white/90"
                          onClick={() => setIsResizeDialogOpen(true)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  ) : (
                    isAdmin && (
                      <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-md flex flex-col items-center justify-center text-center p-4">
                        <ImagePlus className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                          No portrait image set.
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Click to upload or link an Image Block.
                        </p>
                      </div>
                    )
                  )}
                  {mainImageBlock?.caption && (
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                      {mainImageBlock.caption}
                    </p>
                  )}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>

        <AnimatedSection variant="fadeInUp" delay={0.7} className="mt-12">
          <ResumeManager />
        </AnimatedSection>
      </div>

      {/* Image Resize Dialog */}
      <Dialog open={isResizeDialogOpen} onOpenChange={setIsResizeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resize Image</DialogTitle>
            <DialogDescription>
              Adjust the dimensions of your image
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="width" className="text-right">
                Width
              </Label>
              <Input
                id="width"
                type="number"
                value={imageWidth}
                onChange={(e) => setImageWidth(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="height" className="text-right">
                Height
              </Label>
              <Input
                id="height"
                type="number"
                value={imageHeight}
                onChange={(e) => setImageHeight(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResizeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveImageSize}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
