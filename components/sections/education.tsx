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
  Pencil,
  Images,
  GalleryHorizontal,
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
import {
  CldUploadWidget,
  type CloudinaryUploadWidgetResults,
} from "next-cloudinary";

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
  onViewDetails,
  onManageImages,
  isAdmin,
  onDirectImageUpload,
  isAddingImageForItem,
  setIsAddingImageForItemDirectly,
}: {
  item: EducationItem;
  index: number;
  items: EducationItem[];
  confirmDelete: (id: string) => void;
  onViewDetails: (id: string) => void;
  onManageImages: (id: string) => void;
  isAdmin: boolean | undefined;
  onDirectImageUpload: (
    results: CloudinaryUploadWidgetResults,
    itemId: string
  ) => void;
  isAddingImageForItem: string | null;
  setIsAddingImageForItemDirectly: (itemId: string | null) => void;
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
      className={`transition-colors sortable-item ${
        isDragging ? "dragging" : ""
      } ${isAdmin ? "hover:bg-gray-50 dark:hover:bg-gray-700/50" : "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50"}`}
      onClick={() => {
        if (!isAdmin && onViewDetails) {
          onViewDetails(item.id);
        }
      }}
    >
      <div className="flex items-start py-4 px-3 border-b border-gray-200 dark:border-gray-700 space-x-3">
        {isAdmin && (
          <div
            className="sortable-handle cursor-grab active:cursor-grabbing pt-1 flex-shrink-0"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </div>
        )}

        <div className="flex-grow min-w-0">
          <div className={`font-bold uppercase text-lg md:text-xl ${!isAdmin ? 'cursor-pointer' : ''}`}>{item.institution}</div>
          {item.degree && (
            <p className="text-lg text-gray-700 dark:text-gray-300 mt-0.5">
              {item.degree}
            </p>
          )}
          {item.description && (
            <p className="text-md text-gray-500 dark:text-gray-400 mt-1 truncate">
              {item.description}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end space-y-1 ml-auto flex-shrink-0">
          <div className="text-xl italic whitespace-nowrap text-gray-500 dark:text-gray-400">
            {item.period}
          </div>
          {isAdmin && (
            <div className="flex items-center space-x-0.5 mt-1">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-blue-600 hover:bg-transparent h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(item.id);
                  }}
                  title="Edit Details"
                >
                  <Pencil size={14} />
                </Button>
              </motion.div>

              <CldUploadWidget
                uploadPreset={
                  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
                  "portfolio_unsigned"
                }
                options={{
                  sources: ["local", "url"],
                  multiple: false,
                  folder: "education_details",
                  clientAllowedFormats: ["png", "jpeg", "jpg", "gif", "webp"],
                }}
                onSuccess={(results) => {
                  onDirectImageUpload(results, item.id);
                  setIsAddingImageForItemDirectly(null);
                }}
                onUpload={() => setIsAddingImageForItemDirectly(item.id)}
                onError={(error) => {
                  console.error("Direct upload error:", error);
                  let message = "Unknown upload error";
                  if (
                    typeof error === "object" &&
                    error !== null &&
                    "message" in error &&
                    typeof error.message === "string"
                  ) {
                    message = error.message;
                  } else if (typeof error === "string") {
                    message = error;
                  }
                  toast.error(`Direct upload failed: ${message}`);
                  setIsAddingImageForItemDirectly(null);
                }}
              >
                {(widgetApi) => {
                  if (!widgetApi || typeof widgetApi.open !== "function") {
                    return (
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 h-7 w-7"
                          disabled={true}
                          title="Upload Detail Image (Initializing...)"
                        >
                          <Loader2 className="animate-spin" size={14} />
                        </Button>
                      </motion.div>
                    );
                  }
                  const { open } = widgetApi;
                  return (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-green-600 hover:bg-transparent h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          open();
                        }}
                        disabled={isAddingImageForItem === item.id}
                        title="Upload Detail Image"
                      >
                        {isAddingImageForItem === item.id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <Images size={14} />
                        )}
                      </Button>
                    </motion.div>
                  );
                }}
              </CldUploadWidget>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-purple-600 hover:bg-transparent h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onManageImages(item.id);
                  }}
                  title="Manage All Detail Images"
                >
                  <GalleryHorizontal size={14} />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-red-600 hover:bg-transparent h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDelete(item.id);
                  }}
                  title="Delete Item"
                >
                  <Trash2 size={14} />
                </Button>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
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
  const [isAddingImageForItem, setIsAddingImageForItem] = useState<
    string | null
  >(null);
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
          `/api/sections/${section.id}/education/reorder`,
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
      setImageManagerOpen(false);
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

  const [imageManagerOpen, setImageManagerOpen] = useState(false);
  const [currentItemIdForImages, setCurrentItemIdForImages] = useState<
    string | null
  >(null);

  const openImageManager = (educationId: string) => {
    const education = educationItems.find((item) => item.id === educationId);
    if (education) {
      setCurrentEducation(education);
      setCurrentItemIdForImages(educationId);
      setImageManagerOpen(true);
      setDetailDialogOpen(false);
    }
  };

  const addEducationImage = async (
    results: CloudinaryUploadWidgetResults,
    educationItemId: string | null
  ) => {
    if (!educationItemId) {
      toast.error("Cannot add image: Education item ID is missing.");
      return;
    }

    if (
      results?.info &&
      typeof results.info !== "string" &&
      results.info.public_id
    ) {
      const { public_id, secure_url, original_filename } = results.info;
      setIsAddingImage(true);

      const imageData = {
        educationItemId: educationItemId,
        src: secure_url,
        alt: original_filename || `Detail image`,
        imagePublicId: public_id,
      };

      try {
        const response = await fetch("/api/education-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(imageData),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || "Failed to add education detail image"
          );
        }
        toast.success("Education image added!");
        if (onDataChange) onDataChange();
      } catch (error) {
        console.error("Adding education image failed:", error);
        toast.error(`Adding image failed: ${(error as Error).message}`);
      } finally {
        setIsAddingImage(false);
      }
    } else {
      toast.error("Cloudinary upload failed or returned invalid data.");
      console.error("Cloudinary upload error/invalid data:", results);
      if (isAddingImage) setIsAddingImage(false);
    }
  };

  const deleteEducationImage = async (imageId: string) => {
    if (!currentEducation) return;
    const imageToDelete = currentEducation.images.find(
      (img) => img.id === imageId
    );
    if (!imageToDelete) return;

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
      if (onDataChange) onDataChange();
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
                      onViewDetails={viewEducationDetails}
                      onManageImages={openImageManager}
                      isAdmin={isAdmin}
                      onDirectImageUpload={addEducationImage}
                      isAddingImageForItem={isAddingImageForItem}
                      setIsAddingImageForItemDirectly={setIsAddingImageForItem}
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
                      <div>
                        <Label htmlFor="degree">Degree (Optional)</Label>
                        <Input
                          id="degree"
                          value={editedDegree}
                          onChange={(e) => setEditedDegree(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold">
                        {currentEducation.institution}
                      </h3>
                      <p className="text-base font-medium">
                        {currentEducation.degree}
                      </p>
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
                        className="min-h-[100px] mt-1"
                      />
                    ) : (
                      <p className="text-sm text-gray-700 whitespace-pre-line mt-1">
                        {currentEducation.description}
                      </p>
                    )}
                  </div>

                  {/* Image display for non-admins */}
                  {currentEducation &&
                    currentEducation.images &&
                    currentEducation.images.length > 1 && (
                      <div className="mt-4">
                        <h4 className="text-md font-semibold mb-2">
                          Associated Images:
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {currentEducation.images.map((image) => (
                            <motion.div
                              key={image.id}
                              className="relative aspect-square"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Image
                                src={
                                  image.src || "https://picsum.photos/300/300"
                                }
                                alt={image.alt || "Education detail image"}
                                layout="fill"
                                objectFit="cover"
                                className="rounded-md shadow-md"
                              />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

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

      <AnimatePresence>
        {currentEducation && imageManagerOpen && currentItemIdForImages && (
          <Dialog open={imageManagerOpen} onOpenChange={setImageManagerOpen}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl font-bold">
                  Manage Images for {currentEducation.institution}
                </DialogTitle>
                <DialogDescription>
                  Add or remove detail images for this education entry.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <CldUploadWidget
                  uploadPreset="portfolio_unsigned"
                  options={{
                    sources: ["local", "url"],
                    multiple: true,
                    folder: "education_details",
                  }}
                  onSuccess={(results) =>
                    addEducationImage(results, currentItemIdForImages)
                  }
                  onUpload={() => setIsAddingImage(true)}
                  onError={(error) => {
                    const errorMessage =
                      typeof error === "object" &&
                      error !== null &&
                      "message" in error
                        ? String(error.message)
                        : typeof error === "string"
                          ? error
                          : "Unknown upload error";
                    toast.error(`Upload failed: ${errorMessage}`);
                    setIsAddingImage(false);
                  }}
                >
                  {({ open }) => (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="mb-4"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={() => open && open()}
                        disabled={isAddingImage}
                      >
                        {isAddingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <ImagePlus size={14} />
                        )}
                        {isAddingImage ? "Uploading..." : "Add Images"}
                      </Button>
                    </motion.div>
                  )}
                </CldUploadWidget>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {currentEducation.images?.map((image) => (
                      <motion.div key={image.id} className="relative group">
                        <Image
                          src={image.src || "https://picsum.photos/600/400"}
                          alt={image.alt || `Education image`}
                          width={300}
                          height={200}
                          className="w-full h-auto rounded-md shadow-md aspect-video object-cover"
                        />
                        <motion.div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white bg-red-600/70 hover:bg-red-600 rounded-full h-6 w-6 p-1"
                            onClick={() => deleteEducationImage(image.id)}
                            disabled={isDeletingImageById === image.id}
                          >
                            {isDeletingImageById === image.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <X size={12} />
                            )}
                          </Button>
                        </motion.div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {currentEducation.images?.length === 0 && (
                    <div className="col-span-full text-center py-8 border border-dashed rounded-md text-gray-400">
                      No images added yet.
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    onClick={() => setImageManagerOpen(false)}
                  >
                    {" "}
                    Close{" "}
                  </Button>
                </motion.div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </AnimatedSection>
  );
}
