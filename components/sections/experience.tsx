"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Image from "next/image";
import EditableText from "../ui/editable-text";
import EditableImage from "../ui/editable-image";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Trash2,
  AlertCircle,
  GripVertical,
  X,
  Upload,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedSection from "../ui/animated-section";
import { useAuth } from "@/context/auth-context";
import {
  Section as PrismaSection,
  TextBlock as PrismaTextBlock,
  ExperienceItem as PrismaExperienceItem,
  ExperienceDetailImage as PrismaExperienceDetailImage,
} from "../../lib/generated/prisma";
import EditableTextAutoResize from "../ui/editable-text-auto-resize";

// Define an experience type
interface Experience {
  id: string;
  positionTitle: string;
  company: string;
  summary: string;
  description: string;
  imageSrc: string;
  detailImages: string[];
  period: string;
}

// Image Upload Component
function ImageUploadArea({
  onImageSelected,
}: {
  onImageSelected: (file: File) => void;
}) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        onImageSelected(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelected(e.target.files[0]);
    }
  };

  return (
    <div
      className={`drag-drop-area ${isDraggingOver ? "dragging-over" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="experience-image-upload"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <label htmlFor="experience-image-upload" className="cursor-pointer">
        <div className="flex flex-col items-center">
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">
            Click to select an image or drag and drop
          </p>
          <p className="text-xs text-gray-400 mt-2">
            (For this demo, we'll use a random image if no file is selected)
          </p>
        </div>
      </label>
    </div>
  );
}

// Sortable Experience Item Component
function SortableExperienceItem({
  experience,
  isAdmin,
  onView,
  confirmDelete,
  index,
  onSaveExperienceImage,
}: {
  experience: Experience;
  isAdmin: boolean | undefined;
  onView: (id: string) => void;
  confirmDelete: (id: string) => void;
  index: number;
  onSaveExperienceImage: (
    experienceId: string,
    newData: { src?: string; alt?: string }
  ) => Promise<void>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: experience.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`relative group sortable-item ${isDragging ? "dragging" : ""}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      {isAdmin && (
        <div
          className="absolute top-2 left-2 sortable-handle z-10"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-white bg-gray-800/50 rounded-full p-1" />
        </div>
      )}

      <motion.div
        className="overflow-hidden rounded-lg shadow-md"
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="relative cursor-pointer transition-transform duration-300"
          onClick={() => onView(experience.id)}
        >
          <EditableImage
            src={experience.imageSrc}
            alt={experience.positionTitle}
            width={400}
            height={300}
            className="w-full h-auto object-cover"
            // blockId={experience.id}
            // onSave={async (_blockId, newData) =>
            //   onSaveExperienceImage(experience.id, newData)
            // }
            // isAdmin={isAdmin}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-3">
            <div>
              <h3 className="text-white font-bold text-sm sm:text-base">
                {experience.company}
              </h3>
              <p className="text-white text-xs sm:text-sm">
                {experience.summary}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {isAdmin && (
        <motion.div
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="text-white bg-red-600/70 hover:bg-red-600 rounded-full p-1"
            onClick={(e) => {
              e.stopPropagation();
              confirmDelete(experience.id);
            }}
          >
            <Trash2 size={16} />
            <span className="sr-only">Delete experience</span>
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

interface ExperienceSectionProps {
  section: PrismaSection & {
    textBlocks: PrismaTextBlock[];
    experienceItems?: (PrismaExperienceItem & {
      detailImages: PrismaExperienceDetailImage[];
    })[];
  };
  onDataChange?: () => void;
}

export default function ExperienceSection({
  section,
  onDataChange,
}: ExperienceSectionProps) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;
  const introTextBlock = section.textBlocks?.[0];

  const [experiences, setExperiences] = useState<Experience[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setExperiences((items) => {
        const oldIndex = items.findIndex(
          (item) => String(item.id) === String(active.id)
        );
        const newIndex = items.findIndex(
          (item) => String(item.id) === String(over.id)
        );
        if (oldIndex === -1 || newIndex === -1) return items;
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addNewExperience = () => {
    const newExperienceId = `new-exp-${Date.now().toString()}`;
    const newExperience: Experience = {
      id: newExperienceId,
      positionTitle: "NEW POSITION",
      company: "NEW COMPANY",
      period: "Year - Year",
      summary: "Brief summary of role",
      description: "Add your experience description here.",
      imageSrc: `https://picsum.photos/300/200?random=${Math.floor(
        Math.random() * 1000
      )}`,
      detailImages: [],
    };
    setExperiences([...experiences, newExperience]);
  };

  const confirmDelete = (experienceId: string) => {
    setExperiences(experiences.filter((exp) => exp.id !== experienceId));
  };

  const viewExperienceDetails = (experienceId: string) => {
    // Implementation of viewExperienceDetails
  };

  const handleSaveSectionTextBlock = async (
    blockId: string,
    newContent: string
  ) => {
    try {
      const res = await fetch(`/api/textblocks/${blockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || "Failed to save section intro text"
        );
      }
      if (onDataChange) onDataChange();
      else console.warn("ExperienceSection: onDataChange not provided.");
    } catch (error) {
      console.error("Error saving section intro text:", error);
    }
  };

  const handleSaveExperienceImage = async (
    experienceId: string,
    newData: { src?: string; alt?: string }
  ) => {
    console.log(
      `Saving image for experience ${experienceId}, data: ${JSON.stringify(
        newData
      )}`
    );
    console.log(`API call to update ExperienceItem ${experienceId} needed.`);
    try {
      // TODO: Implement API call to PUT /api/experience/${experienceId} with { imageSrc: newData.src, imageAlt: newData.alt }
      // Example placeholder for fetch:
      /*
      const res = await fetch(`/api/experience/${experienceId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageSrc: newData.src, imageAlt: newData.alt }), // Send relevant fields
      });
      if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `Failed to update image for experience ${experienceId}`);
      }
      */
      // If API call successful:
      if (onDataChange) {
        onDataChange(); // Refresh all data
      } else {
        // Fallback: Local update if no refresh callback
        setExperiences((prev) =>
          prev.map((e) =>
            e.id === experienceId
              ? { ...e, imageSrc: newData.src || e.imageSrc }
              : e
          )
        );
      }
    } catch (error) {
      console.error(
        `Error saving image for experience ${experienceId}:`,
        error
      );
      // Potentially show error to user
      throw error; // Re-throw for EditableImage if needed
    }
  };

  useEffect(() => {
    const mappedExperiences: Experience[] =
      section.experienceItems?.map((item): Experience => {
        // No longer mapping imageBlockId
        return {
          id: String(item.id),
          positionTitle: item.positionTitle || "",
          company: item.companyName || "",
          period: item.period || "",
          summary: item.summary || "",
          description: item.description || "",
          imageSrc: item.imageSrc || "",
          detailImages:
            item.detailImages
              ?.map((img: PrismaExperienceDetailImage) => img.src)
              .filter((src): src is string => !!src) || [],
          // imageBlockId: findImageBlockId('experienceCover'), // REMOVED
        };
      }) || [];
    setExperiences(mappedExperiences);
  }, [section.experienceItems]);

  return (
    <AnimatedSection variant="fadeInUp">
      <section
        id={section.id}
        className="shadow-sm dark:shadow-gray-900 dark:shadow-sm py-16 md:py-20 lg:py-24"
      >
        <div className="max-w-6xl mx-auto px-4">
          {/* Section Title and Subtitle */}
          <div className="text-center mb-12 md:mb-16">
            <EditableTextAutoResize
              initialText={section.title || "EXPERIENCE"}
              as="h1"
              className="text-red-600 text-5xl sm:text-[80px] md:text-[100px] lg:text-[135px] font-bold leading-none tracking-tighter mb-2"
            />
            {introTextBlock && (
              <EditableText
                initialText={introTextBlock.content}
                className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto"
                as="p"
                // blockId={introTextBlock.id}
                // onSave={handleSaveSectionTextBlock}
                // isAdmin={isAdmin}
              />
            )}
            {!introTextBlock && isAdmin && (
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Intro text block missing.
              </p>
            )}
          </div>

          {/* Experience Grid */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={experiences.map((exp) => exp.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {experiences.map((experience, index) => (
                  <SortableExperienceItem
                    key={experience.id}
                    experience={experience}
                    isAdmin={isAdmin}
                    onView={viewExperienceDetails}
                    confirmDelete={confirmDelete}
                    index={index}
                    onSaveExperienceImage={handleSaveExperienceImage}
                  />
                ))}
              </div>
            </SortableContext>

            {/* Add New Experience Button - Only visible to admin */}
            {isAdmin && (
              <motion.div
                className="mt-8 flex justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.3 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={addNewExperience}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <PlusCircle size={16} />
                    Add Experience
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </DndContext>
        </div>
      </section>
    </AnimatedSection>
  );
}
