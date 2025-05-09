"use client";

import EditableText from "../ui/editable-text";
import EditableImage from "../ui/editable-image";
import AnimatedSection from "../ui/animated-section";
import ResumeManager from "../ui/resume-manager";
import EditableTextAutoResize from "../ui/editable-text-auto-resize";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, Pencil, ImagePlus } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useState } from "react";
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
    imageBlocks: PrismaImageBlock[];
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-6">
            <AnimatedSection variant="fadeInUp" delay={0.3}>
              <div className="space-y-6">
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

          <div className="lg:col-span-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <AnimatedSection variant="fadeInUp" delay={0.5}>
                <div className="space-y-6">
                  {sideTextBlock && (
                    <EditableText
                      key={sideTextBlock.id}
                      initialText={sideTextBlock.content || ""}
                      initialFontSize={sideTextBlock.fontSize || 14}
                      initialFontFamily={
                        sideTextBlock.fontFamily || "font-sans"
                      }
                      className="text-gray-700 dark:text-gray-300 leading-relaxed"
                      blockId={sideTextBlock.id}
                      onCommitText={handleSaveTextBlock}
                    />
                  )}
                </div>
              </AnimatedSection>

              <AnimatedSection variant="zoomIn" delay={0.7}>
                <div className="mt-4 relative w-full aspect-[8/9] overflow-hidden rounded-md shadow-md hover:shadow-lg transition-shadow duration-300">
                  {mainImageBlock ? (
                    <EditableImage
                      key={mainImageBlock.id}
                      src={mainImageBlock.src || "/images/placeholder-introduction.png"}
                      alt={mainImageBlock.alt || "Introduction portrait"}
                      width={400}
                      height={450}
                      className="w-full h-full object-cover"
                      onImageUploaded={(imageData) =>
                        handleUploadedImageSave(
                          String(mainImageBlock.id),
                          imageData
                        )
                      }
                      uploadPreset="portfolio_unsigned"
                    />
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
              </AnimatedSection>
            </div>
          </div>
        </div>

        <AnimatedSection variant="fadeInUp" delay={0.7} className="mt-12">
          <ResumeManager />
        </AnimatedSection>
      </div>
    </section>
  );
}
