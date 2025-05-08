"use client";

import type React from "react";
import { useState, useEffect } from "react";
import EditableText from "../ui/editable-text";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Trash2,
  AlertCircle,
  GripVertical,
  ImagePlus,
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
import { motion, AnimatePresence } from "framer-motion";
import AnimatedSection from "../ui/animated-section";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useAuth } from "@/context/auth-context";
import EditableTextAutoResize from "../ui/editable-text-auto-resize";
import { toast } from "sonner";
import {
  Section as PrismaSection,
  TextBlock as PrismaTextBlock,
  EducationItem as PrismaEducationItem,
  EducationImage as PrismaEducationImage,
} from "../../lib/generated/prisma";

// Local UI EducationItem type
interface EducationItem {
  id: string;
  institution: string;
  period: string;
  description: string;
  degree: string;
  images: PrismaEducationImage[];
}

// Sortable Education Item Component
function SortableEducationItem({
  item,
  index,
  items,
  confirmDelete,
  onView,
  isAdmin,
}: {
  item: EducationItem;
  index: number;
  items: EducationItem[];
  confirmDelete: (id: string) => void;
  onView: (id: string) => void;
  isAdmin: boolean | undefined;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      onClick={() => onView(item.id)}
      className={`cursor-pointer hover:bg-gray-50 transition-colors sortable-item ${
        isDragging ? "dragging" : ""
      }`}
    >
      <div className="grid grid-cols-12 gap-2 items-center py-3 border-b border-gray-200">
        {isAdmin && (
          <div
            className="col-span-1 sortable-handle"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()} // Prevent opening dialog when grabbing
          >
            <GripVertical className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </div>
        )}

        <div
          className={
            isAdmin ? "col-span-7 md:col-span-8" : "col-span-8 md:col-span-9"
          }
        >
          <div className="font-bold uppercase">{item.institution}</div>
        </div>

        <div className="col-span-3 md:col-span-2 text-right">
          <div className="text-sm italic">{item.period}</div>
        </div>

        {isAdmin && (
          <div className="col-span-1">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation(); // Prevent opening dialog when deleting
                confirmDelete(item.id);
              }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-red-600 hover:bg-transparent"
              >
                <Trash2 size={16} />
                <span className="sr-only">Delete education</span>
              </Button>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
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
        id="image-upload"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <label htmlFor="image-upload" className="cursor-pointer">
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

interface EducationSectionProps {
  section: PrismaSection & {
    textBlocks: PrismaTextBlock[];
    educationItems?: (PrismaEducationItem & {
      images: PrismaEducationImage[];
    })[];
  };
  onDataChange: () => void;
}

export default function EducationSection({
  section,
  onDataChange,
}: EducationSectionProps) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;
  const introTextBlock = section.textBlocks?.[0];
  const sectionId = section.slug;

  const [educationItems, setEducationItems] = useState<EducationItem[]>([]);

  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isSavingSectionText, setIsSavingSectionText] = useState(false);
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [isDeletingImageById, setIsDeletingImageById] = useState<string | null>(
    null
  );

  const handleSaveSectionTextBlock = async (
    blockId: string,
    newContent: string,
    newFontSize?: number,
    newFontFamily?: string
  ) => {
    try {
      setIsSavingSectionText(true);
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
      toast.success("Section intro text saved!");
    } catch (error) {
      console.error("Error saving section intro text:", error);
      toast.error(`Failed to save intro text: ${(error as Error).message}`);
    } finally {
      setIsSavingSectionText(false);
    }
  };

  useEffect(() => {
    const mappedItems =
      section.educationItems?.map((apiItem) => ({
        id: String(apiItem.id),
        institution: apiItem.institution || "",
        period: apiItem.period || "",
        description: apiItem.description || "",
        degree: apiItem.degree || "",
        images: apiItem.images || [],
      })) || [];
    setEducationItems(mappedItems);
  }, [section.educationItems]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [currentEducation, setCurrentEducation] =
    useState<EducationItem | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedInstitution, setEditedInstitution] = useState("");
  const [editedPeriod, setEditedPeriod] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedDegree, setEditedDegree] = useState("");

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
      const oldIndex = educationItems.findIndex(
        (item) => String(item.id) === String(active.id)
      );
      const newIndex = educationItems.findIndex(
        (item) => String(item.id) === String(over.id)
      );
      if (oldIndex === -1 || newIndex === -1) return;

      const reorderedItems = arrayMove(educationItems, oldIndex, newIndex);
      setEducationItems(reorderedItems);
      setIsReordering(true);

      const orderedIds = reorderedItems.map((item) => item.id);

      try {
        const response = await fetch(
          `/api/sections/${sectionId}/education/reorder`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderedIds }),
          }
        );
        if (!response.ok) {
          throw new Error("Failed to reorder items");
        }
        if (onDataChange) onDataChange();
        toast.success("Education items reordered!");
      } catch (error) {
        console.error("Reordering failed:", error);
        toast.error(`Reordering failed: ${(error as Error).message}`);
        if (onDataChange) onDataChange();
      } finally {
        setIsReordering(false);
      }
    }
  };

  const addNewEducationItem = async () => {
    const newItemData = {
      sectionId: section.id,
      institution: "NEW INSTITUTION",
      period: `${new Date().getFullYear()}-Present`,
      description: "Add details about this education here.",
      degree: "New Degree",
    };

    try {
      setIsAdding(true);
      const response = await fetch("/api/education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItemData),
      });

      if (!response.ok) {
        throw new Error("Failed to add new education item");
      }
      if (onDataChange) onDataChange();
      toast.success("New education item added!");
    } catch (error) {
      console.error("Adding education item failed:", error);
      toast.error(`Adding item failed: ${(error as Error).message}`);
    } finally {
      setIsAdding(false);
    }
  };

  const confirmDelete = (itemId: string) => {
    setItemToDelete(itemId);
    setDeleteDialogOpen(true);
  };

  const deleteEducationItem = async () => {
    if (itemToDelete === null) return;
    const idToDelete = itemToDelete;

    setDeleteDialogOpen(false);
    setItemToDelete(null);

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/education/${idToDelete}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete education item");
      }
      if (onDataChange) onDataChange();
      toast.success("Education item deleted!");
    } catch (error) {
      console.error("Deleting education item failed:", error);
      toast.error(`Deleting item failed: ${(error as Error).message}`);
      if (onDataChange) onDataChange();
    } finally {
      setIsDeleting(false);
    }
  };

  const viewEducationDetails = (educationId: string) => {
    const education = educationItems.find((item) => item.id === educationId);
    if (education) {
      setCurrentEducation(education);
      setEditedInstitution(education.institution);
      setEditedPeriod(education.period);
      setEditedDescription(education.description);
      setEditedDegree(education.degree);
      setDetailDialogOpen(true);
    }
  };

  const saveEducationDetails = async () => {
    if (!currentEducation) return;

    setIsSavingDetails(true);
    const updatedData = {
      institution: editedInstitution,
      period: editedPeriod,
      description: editedDescription,
      degree: editedDegree,
    };

    try {
      const response = await fetch(`/api/education/${currentEducation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) {
        throw new Error("Failed to update education details");
      }
      setDetailDialogOpen(false);
      setIsEditing(false);
      if (onDataChange) onDataChange();
      toast.success("Education details saved!");
    } catch (error) {
      console.error("Updating education details failed:", error);
      toast.error(`Saving details failed: ${(error as Error).message}`);
    } finally {
      setIsSavingDetails(false);
    }
  };

  const addEducationImage = async (file?: File) => {
    if (!currentEducation) return;
    setIsAddingImage(true);

    let imageSrcForApi = `https://picsum.photos/600/400?random=edu_detail_${Date.now()}`;
    if (file) {
      console.warn(
        "File selected, but using placeholder for API save. Implement actual file upload."
      );
    }

    const imageData = {
      educationItemId: currentEducation.id,
      src: imageSrcForApi,
      alt: `Detail image for ${currentEducation.institution}`,
    };

    try {
      const response = await fetch("/api/education-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(imageData),
      });
      if (!response.ok) {
        throw new Error("Failed to add education detail image");
      }
      toast.success("Education image added!");
      if (onDataChange) {
        onDataChange();
      } else {
        console.warn(
          "addEducationImage: onDataChange not provided, UI might not reflect server state accurately."
        );
      }
    } catch (error) {
      console.error("Adding education image failed:", error);
      toast.error(`Adding image failed: ${(error as Error).message}`);
    } finally {
      setIsAddingImage(false);
    }
  };

  const deleteEducationImage = async (imageId: string) => {
    if (!currentEducation) return;
    setIsDeletingImageById(imageId);

    try {
      const response = await fetch(`/api/education-images/${imageId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to delete education detail image"
        );
      }
      toast.success("Education image deleted!");
      if (onDataChange) {
        onDataChange();
      } else {
        console.warn(
          "deleteEducationImage: onDataChange not provided, UI might not reflect server state accurately."
        );
      }
    } catch (error) {
      console.error("Deleting education image failed:", error);
      toast.error(`Deleting image failed: ${(error as Error).message}`);
      if (onDataChange) onDataChange();
    } finally {
      setIsDeletingImageById(null);
    }
  };

  return (
    <AnimatedSection variant="fadeInUp">
      <section
        id={sectionId}
        className="shadow-sm bg-gray-100 dark:shadow-gray-900 dark:shadow-sm py-16 md:py-20 lg:py-24"
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <EditableTextAutoResize
              initialText={section.title || "EDUCATION"}
              as="h1"
              className="text-red-600 text-5xl sm:text-[80px] md:text-[100px] lg:text-[135px] font-bold leading-none tracking-tighter mb-2"
            />
            {introTextBlock && (
              <EditableText
                key={introTextBlock.id}
                blockId={introTextBlock.id}
                initialText={introTextBlock.content}
                initialFontSize={introTextBlock.fontSize || undefined}
                initialFontFamily={introTextBlock.fontFamily || undefined}
                className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto"
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

          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 md:p-8">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[]}
            >
              <SortableContext
                items={educationItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <AnimatePresence>
                  {educationItems.map((item, index) => (
                    <SortableEducationItem
                      key={item.id}
                      item={item}
                      index={index}
                      items={educationItems}
                      confirmDelete={confirmDelete}
                      onView={viewEducationDetails}
                      isAdmin={isAdmin}
                    />
                  ))}
                </AnimatePresence>
              </SortableContext>
            </DndContext>

            {isAdmin && (
              <motion.div
                className="mt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    onClick={addNewEducationItem}
                    variant="secondary"
                    className="border-red-600 text-red-600 hover:bg-red-50 flex items-center gap-2"
                    disabled={isAdding}
                  >
                    {isAdding ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <PlusCircle size={16} />
                    )}
                    {isAdding ? "Adding..." : "Add Education"}
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

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
                    Are you sure you want to delete this education item? This
                    action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-start mt-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="destructive"
                      onClick={deleteEducationItem}
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

      <AnimatePresence>
        {currentEducation && detailDialogOpen && (
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
                    Education Details
                  </DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-6">
                  {isAdmin ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="institution">Institution</Label>
                        <Input
                          id="institution"
                          value={editedInstitution}
                          onChange={(e) => setEditedInstitution(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="period">Period</Label>
                        <Input
                          id="period"
                          value={editedPeriod}
                          onChange={(e) => setEditedPeriod(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold">
                        {currentEducation.institution}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {currentEducation.period}
                      </p>
                    </div>
                  )}

                  <div className="relative">
                    <Label htmlFor="description">Description</Label>
                    {isAdmin ? (
                      <Textarea
                        id="description"
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        className="min-h-[150px] mt-1"
                      />
                    ) : (
                      <p className="text-sm text-gray-700 whitespace-pre-line mt-1">
                        {currentEducation.description}
                      </p>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex justify-end">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          onClick={saveEducationDetails}
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

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Education Images</h3>
                      {isAdmin && (
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => addEducationImage()}
                            disabled={isAddingImage}
                          >
                            {isAddingImage ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <ImagePlus size={14} />
                            )}
                            {isAddingImage ? "Adding..." : "Add Random Image"}
                          </Button>
                        </motion.div>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="mb-4">
                        <ImageUploadArea
                          onImageSelected={(file) => addEducationImage(file)}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <AnimatePresence>
                        {currentEducation.images.map((image, index) => (
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
                                `${currentEducation.institution} image ${
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
                                  onClick={() => deleteEducationImage(image.id)}
                                  disabled={isDeletingImageById === image.id}
                                >
                                  {isDeletingImageById === image.id ? (
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

                      {currentEducation.images.length === 0 && (
                        <div className="col-span-2 text-center py-8 border border-dashed rounded-md text-gray-400">
                          No education images available
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
