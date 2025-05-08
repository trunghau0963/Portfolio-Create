"use client";
import { useAuth } from "@/context/auth-context";
import GridLayoutManager from "../ui/grid-layout-manager";
import EditableText from "@/components/ui/editable-text";
import EditableImage from "@/components/ui/editable-image";
import EditableTextAutoResize from "../ui/editable-text-auto-resize";
import {
  Section as PrismaSection,
  TextBlock as PrismaTextBlock,
  ImageBlock as PrismaImageBlock,
  CustomSectionContentBlock as PrismaCustomSectionContentBlock,
} from "../../lib/generated/prisma";
import AnimatedSection from "../ui/animated-section";

interface CustomSectionProps {
  section: PrismaSection & {
    textBlocks: PrismaTextBlock[];
    imageBlocks: PrismaImageBlock[];
    customSectionContentBlocks: PrismaCustomSectionContentBlock[];
  };
  onDataChange?: () => void;
}

export default function CustomSection({
  section,
  onDataChange,
}: CustomSectionProps) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;

  const introTextBlocks = section.textBlocks || [];
  const introImageBlocks = section.imageBlocks || [];

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
      if (onDataChange) onDataChange();
      else console.warn("CustomSection: onDataChange not provided.");
    } catch (error) {
      console.error("Error saving text block:", error);
    }
  };

  const handleSaveImageBlock = async (
    blockId: string,
    newData: { src?: string; alt?: string }
  ) => {
    try {
      const res = await fetch(`/api/imageblocks/${blockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      }); 
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save image block");
      }
      if (onDataChange) onDataChange();
      else console.warn("CustomSection: onDataChange not provided.");
    } catch (error) {
      console.error("Error saving image block:", error);
    }
  };

  return (
    <section
      id={section.id}
      className="py-16 md:py-20 lg:py-24 bg-gray-100 dark:bg-gray-900"
    >
      <div className="max-w-6xl mx-auto px-4">
        <AnimatedSection variant="fadeInDown">
          <EditableTextAutoResize
            initialText={section.title || "Custom Section"}
            as="h1"
            className="text-center text-red-600 text-5xl sm:text-[80px] md:text-[100px] lg:text-[135px] font-bold leading-none tracking-tighter mb-8 md:mb-12"
          />
        </AnimatedSection>

        {introTextBlocks.length > 0 && (
          <AnimatedSection variant="fadeInUp" delay={0.1}>
            <div className="prose dark:prose-invert max-w-3xl mx-auto mb-8 text-center">
              {introTextBlocks.map((block) => (
                <EditableText
                  key={block.id}
                  initialText={block.content}
                  as="p"
                  // isAdmin={isAdmin}
                />
              ))}
            </div>
          </AnimatedSection>
        )}

        {introImageBlocks.length > 0 && (
          <AnimatedSection variant="fadeInUp" delay={0.2}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 md:mb-12">
              {introImageBlocks.map((block) => (
                <EditableImage
                  key={block.id}
                  src={block.src}
                  alt={block.alt || "Custom section image"}
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover rounded-md shadow-md"
                  // blockId={block.id}
                  // onSave={handleSaveImageBlock}
                  // isAdmin={isAdmin}
                />
              ))}
            </div>
          </AnimatedSection>
        )}

        <GridLayoutManager sectionId={section.id} />
      </div>
    </section>
  );
}
