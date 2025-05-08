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
  const sectionId = section.id;

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "text" | "image";
    id: string;
  } | null>(null);

  const handleSaveTextBlock = async (blockId: string, newContent: string) => {
    try {
      const res = await fetch(`/api/textblocks/${blockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save text block");
      }
      onDataChange();
    } catch (error) {
      console.error("Error in handleSaveTextBlock:", error);
      throw error;
    }
  };

  const handleSaveImageBlock = async (
    blockId: string,
    data: { src?: string; alt?: string }
  ) => {
    try {
      const res = await fetch(`/api/imageblocks/${blockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save image block");
      }
      onDataChange();
    } catch (error) {
      console.error("Error in handleSaveImageBlock:", error);
      throw error;
    }
  };

  const mainTextBlocks = section.textBlocks?.slice(0, 1) || [];
  const sideTextBlock =
    section.textBlocks?.length > 1 ? section.textBlocks[1] : null;
  const mainImageBlock = section.imageBlocks?.[0];

  return (
    <section
      id={section.id}
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
                    initialFontSize={14}
                    className="text-gray-700 dark:text-gray-300 leading-relaxed"
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
                      initialFontSize={14}
                      className="text-gray-700 dark:text-gray-300 leading-relaxed"
                    />
                  )}
                </div>
              </AnimatedSection>

              <AnimatedSection variant="zoomIn" delay={0.7}>
                <div className="mt-4">
                  {mainImageBlock ? (
                    <EditableImage
                      key={mainImageBlock.id}
                      src={mainImageBlock.src || ""}
                      alt={mainImageBlock.alt || "Introduction image"}
                      width={400}
                      height={300}
                      // onSave={handleSaveImageBlock}
                      // isAdmin={isAdmin}
                      className="w-full h-auto object-cover rounded-md shadow-md hover:shadow-lg transition-shadow duration-300"
                    />
                  ) : (
                    <div className="w-full h-[300px] bg-gray-200 rounded-md flex items-center justify-center">
                      <span className="text-gray-400 text-sm">
                        No image available
                      </span>
                    </div>
                  )}
                  {mainImageBlock?.caption && (
                    <p className="text-xs text-gray-500 mt-1">
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
