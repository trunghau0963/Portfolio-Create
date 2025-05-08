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
  Loader2,
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
import { toast } from "sonner";

// Define an experience type
interface Experience {
  id: string;
  positionTitle: string;
  company: string;
  summary: string;
  description: string;
  imageSrc: string;
  detailImages: PrismaExperienceDetailImage[];
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
}: {
  experience: Experience;
  isAdmin: boolean | undefined;
  onView: (id: string) => void;
  confirmDelete: (id: string) => void;
  index: number;
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
  onDataChange: () => void;
}

export default function ExperienceSection({
  section,
  onDataChange,
}: ExperienceSectionProps) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;
  const introTextBlock = section.textBlocks?.[0];
  const sectionId = section.slug;

  const [experiences, setExperiences] = useState<Experience[]>([]);

  // Restore state variables for the detail dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [experienceToDelete, setExperienceToDelete] = useState<string | null>(
    null
  );
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [currentExperience, setCurrentExperience] = useState<Experience | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editedPositionTitle, setEditedPositionTitle] = useState("");
  const [editedCompany, setEditedCompany] = useState("");
  const [editedPeriod, setEditedPeriod] = useState("");
  const [editedSummary, setEditedSummary] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState<number | null>(null);
  const [isSavingSectionText, setIsSavingSectionText] = useState(false);

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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = experiences.findIndex(
        (item) => String(item.id) === String(active.id)
      );
      const newIndex = experiences.findIndex(
        (item) => String(item.id) === String(over.id)
      );
      if (oldIndex === -1 || newIndex === -1) return;

      // Determine the reordered items BEFORE updating state
      const reorderedItems = arrayMove(experiences, oldIndex, newIndex);
      const orderedIds = reorderedItems.map((item) => item.id);

      // Optimistic UI update
      setExperiences(reorderedItems);

      // API call for reordering
      setIsReordering(true);
      try {
        const response = await fetch(
          `/api/sections/${section.id}/experience/reorder`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderedIds }), // Send the ordered IDs
          }
        );
        if (!response.ok) {
          throw new Error("Failed to reorder experience items");
        }
        toast.success("Experience items reordered!");
        if (onDataChange) onDataChange();
      } catch (error) {
        console.error("Reordering failed:", error);
        toast.error(`Reordering failed: ${(error as Error).message}`);
        // Revert optimistic update on error by re-fetching
        if (onDataChange) onDataChange();
      } finally {
        setIsReordering(false);
      }
    }
  };

  const addNewExperience = async () => {
    setIsAdding(true);
    const newItemData = {
      sectionId: section.id,
      positionTitle: "NEW POSITION",
      companyName: "NEW COMPANY",
      period: "Year - Year",
      summary: "Brief summary of role",
      description: "Add your experience description here.",
      imageSrc: `https://picsum.photos/300/200?random=${Math.floor(
        Math.random() * 1000
      )}`, // Placeholder image
    };

    try {
      const response = await fetch("/api/experience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItemData),
      });
      if (!response.ok) {
        throw new Error("Failed to add new experience item");
      }
      toast.success("New experience item added!");
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error("Adding experience item failed:", error);
      toast.error(`Adding item failed: ${(error as Error).message}`);
    } finally {
      setIsAdding(false);
    }
  };

  const confirmDelete = (experienceId: string) => {
    setExperienceToDelete(experienceId);
    setDeleteDialogOpen(true);
  };

  const deleteExperience = async () => {
    if (experienceToDelete === null) return;
    const idToDelete = experienceToDelete;
    setIsDeleting(true);
    setDeleteDialogOpen(false);
    setExperienceToDelete(null);

    try {
      const response = await fetch(`/api/experience/${idToDelete}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to delete experience item"
        );
      }
      toast.success("Experience item deleted!");
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error("Deleting experience item failed:", error);
      toast.error(`Deleting item failed: ${(error as Error).message}`);
      if (onDataChange) onDataChange(); // Re-fetch to ensure consistency
    } finally {
      setIsDeleting(false);
    }
  };

  const viewExperienceDetails = (experienceId: string) => {
    const experience = experiences.find((exp) => exp.id === experienceId);
    if (experience) {
      setCurrentExperience(experience);
      setEditedPositionTitle(experience.positionTitle);
      setEditedCompany(experience.company);
      setEditedPeriod(experience.period);
      setEditedSummary(experience.summary);
      setEditedDescription(experience.description);
      setIsEditing(false);
      setDetailDialogOpen(true);
    }
  };

  const saveExperienceDetails = async () => {
    if (!currentExperience) return;
    setIsSavingDetails(true);

    const updatedData = {
      positionTitle: editedPositionTitle,
      companyName: editedCompany, // API expects companyName
      period: editedPeriod,
      summary: editedSummary,
      description: editedDescription,
      // imageSrc is updated separately if using EditableImage or another mechanism
    };

    try {
      const response = await fetch(`/api/experience/${currentExperience.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) {
        throw new Error("Failed to update experience details");
      }
      toast.success("Experience details saved!");
      setDetailDialogOpen(false); // Close dialog on success
      setIsEditing(false);
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error("Updating experience details failed:", error);
      toast.error(`Saving details failed: ${(error as Error).message}`);
    } finally {
      setIsSavingDetails(false);
    }
  };

  const addDetailImage = async (file?: File) => {
    if (!currentExperience) return;
    setIsAddingImage(true);

    // Determine image src (placeholder or actual upload result in future)
    let imageSrcForApi = `https://picsum.photos/600/400?random=exp_detail_${Date.now()}`;
    let localPreviewUrl: string | undefined = undefined;
    if (file) {
      localPreviewUrl = URL.createObjectURL(file);
      // In real scenario: upload file, get URL, use it for imageSrcForApi
      imageSrcForApi = localPreviewUrl; // Using local for now for API save
      console.warn("Using local/placeholder URL for saving detail image.");
    }

    const imageData = {
      experienceItemId: currentExperience.id,
      src: imageSrcForApi,
      alt: `Detail image for ${currentExperience.positionTitle}`,
      // order: currentExperience.detailImages.length // Handled by API
    };

    try {
      const response = await fetch("/api/experience-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(imageData),
      });
      if (!response.ok) {
        throw new Error("Failed to add detail image");
      }
      toast.success("Detail image added!");

      if (onDataChange) {
        onDataChange();
      } else {
        // This else block should ideally not be reached if onDataChange is mandatory
        // and correctly passed by the parent.
        console.warn(
          "ExperienceSection: addDetailImage - onDataChange is not defined. UI might not update."
        );
      }
    } catch (error) {
      console.error("Adding detail image failed:", error);
      toast.error(`Adding image failed: ${(error as Error).message}`);
    } finally {
      setIsAddingImage(false);
    }
  };

  const deleteDetailImage = async (index: number) => {
    if (!currentExperience) return;

    const imageToDelete = currentExperience.detailImages[index];
    if (!imageToDelete || !imageToDelete.id) {
      console.error("Image ID not found at index", index);
      toast.error("Image ID not found.");
      return;
    }
    const imageIdToDelete = imageToDelete.id;

    setIsDeletingImage(index); // Use index for UI feedback
    try {
      const response = await fetch(
        `/api/experience-images/${imageIdToDelete}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete detail image");
      }
      toast.success("Detail image deleted!");
      if (onDataChange) {
        onDataChange();
      } else {
        // This else block should ideally not be reached if onDataChange is mandatory.
        console.warn(
          "ExperienceSection: deleteDetailImage - onDataChange is not defined. UI might not update."
        );
      }
    } catch (error) {
      console.error("Deleting detail image failed:", error);
      toast.error(`Deleting image failed: ${(error as Error).message}`);
      // Optionally re-fetch on error too
      if (onDataChange) onDataChange();
    } finally {
      setIsDeletingImage(null);
    }
  };

  const handleSaveSectionTextBlock = async (
    blockId: string,
    newContent: string,
    newFontSize?: number,
    newFontFamily?: string
  ) => {
    setIsSavingSectionText(true);
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
        throw new Error(
          errorData.message || "Failed to save section intro text"
        );
      }
      if (onDataChange) onDataChange();
      else console.warn("ExperienceSection: onDataChange not provided.");
    } catch (error) {
      console.error("Error saving section intro text:", error);
    } finally {
      setIsSavingSectionText(false);
    }
  };

  useEffect(() => {
    const mappedExperiences: Experience[] =
      section.experienceItems?.map((item): Experience => {
        return {
          id: String(item.id),
          positionTitle: item.positionTitle || "",
          company: item.companyName || "",
          period: item.period || "",
          summary: item.summary || "",
          description: item.description || "",
          imageSrc: item.imageSrc || "",
          detailImages: item.detailImages || [],
        };
      }) || [];
    setExperiences(mappedExperiences);
  }, [section.experienceItems]);

  return (
    <AnimatedSection variant="fadeInUp">
      <section
        id={sectionId}
        className="shadow-sm bg-red-600 dark:shadow-gray-900 dark:shadow-sm py-16 md:py-20 lg:py-24"
      >
        <div className="max-w-6xl mx-auto px-4">
          {/* Section Title and Subtitle */}
          <div className="text-center mb-12 md:mb-16">
            <EditableTextAutoResize
              initialText={section.title || "EXPERIENCE"}
              as="h1"
              className="text-white text-5xl sm:text-[80px] md:text-[100px] lg:text-[135px] font-bold leading-none tracking-tighter mb-2"
            />
            {introTextBlock && (
              <EditableText
                key={introTextBlock.id}
                blockId={introTextBlock.id}
                initialText={introTextBlock.content}
                initialFontSize={introTextBlock.fontSize || undefined}
                initialFontFamily={introTextBlock.fontFamily || undefined}
                className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto"
                as="p"
                onCommitText={handleSaveSectionTextBlock}
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
                    disabled={isAdding}
                  >
                    {isAdding ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <PlusCircle size={16} />
                    )}
                    {isAdding ? "Adding..." : "Add Experience"}
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </DndContext>
        </div>
      </section>

      {/* Delete Confirmation Dialog (Modified to use string ID state) */}
      <AnimatePresence>
        {deleteDialogOpen && (
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
              >
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Confirm Deletion
                  </DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this experience? This action
                    cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-start mt-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="destructive"
                      onClick={deleteExperience}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      onClick={() => setDeleteDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                  </motion.div>
                </DialogFooter>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Restore Experience Detail Dialog JSX */}
      <AnimatePresence>
        {currentExperience && detailDialogOpen && (
          <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl font-bold">
                    Experience Details
                  </DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-6">
                  {/* Experience Fields - Use state for editing */}
                  {isAdmin ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="expPositionTitle">Position Title</Label>
                        <Input
                          id="expPositionTitle"
                          value={editedPositionTitle}
                          onChange={(e) =>
                            setEditedPositionTitle(e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="expCompany">Company</Label>
                        <Input
                          id="expCompany"
                          value={editedCompany}
                          onChange={(e) => setEditedCompany(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="expPeriod">Period</Label>
                        <Input
                          id="expPeriod"
                          value={editedPeriod}
                          onChange={(e) => setEditedPeriod(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="expSummary">Summary</Label>
                        <Input
                          id="expSummary"
                          value={editedSummary}
                          onChange={(e) => setEditedSummary(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="expDescription">Description</Label>
                        <Textarea
                          id="expDescription"
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          className="min-h-[150px] mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-bold">
                          {currentExperience.positionTitle}
                        </h3>
                        <p className="text-base font-medium">
                          {currentExperience.company}
                        </p>
                        <p className="text-sm text-gray-500">
                          {currentExperience.period}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {currentExperience.summary}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 whitespace-pre-line">
                          {currentExperience.description}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Save Button for Admin */}
                  {isAdmin && (
                    <div className="flex justify-end">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          onClick={saveExperienceDetails}
                          disabled={isSavingDetails}
                        >
                          {isSavingDetails ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : null}
                          {isSavingDetails ? "Saving..." : "Save Details"}
                        </Button>
                      </motion.div>
                    </div>
                  )}

                  {/* Detail Images */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Project Images</h3>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                              onClick={() => addDetailImage()}
                              disabled={isAddingImage}
                            >
                              {isAddingImage ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                              ) : (
                                <PlusCircle size={14} />
                              )}
                              {isAddingImage ? "Adding..." : "Add Random Image"}
                            </Button>
                          </motion.div>
                        </div>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="mb-4">
                        <ImageUploadArea
                          onImageSelected={(file) => addDetailImage(file)}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <AnimatePresence>
                        {currentExperience.detailImages.map((image, index) => (
                          <motion.div
                            key={image.id}
                            className="relative group"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            whileHover={{ scale: 1.03 }}
                          >
                            <Image
                              src={image.src || "https://picsum.photos/600/400"}
                              alt={
                                image.alt ||
                                `${currentExperience.positionTitle} detail ${
                                  index + 1
                                }`
                              }
                              width={600}
                              height={400}
                              className="w-full h-auto rounded-md shadow-md"
                            />
                            {isAdmin && (
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-white bg-red-600/70 hover:bg-red-600 rounded-full p-1"
                                  onClick={() => deleteDetailImage(index)}
                                  disabled={isDeletingImage === index}
                                >
                                  {isDeletingImage === index ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <X size={14} />
                                  )}
                                  <span className="sr-only">Remove image</span>
                                </Button>
                              </motion.div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {currentExperience.detailImages.length === 0 && (
                        <div className="col-span-2 text-center py-8 border border-dashed rounded-md text-gray-400">
                          No project images available
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      onClick={() => setDetailDialogOpen(false)}
                    >
                      Close
                    </Button>
                  </motion.div>
                </DialogFooter>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </AnimatedSection>
  );
}
