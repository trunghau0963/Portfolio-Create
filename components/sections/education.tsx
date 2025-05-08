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
import {
  Section as PrismaSection,
  TextBlock as PrismaTextBlock,
  EducationItem as PrismaEducationItem,
} from "../../lib/generated/prisma";

// Local UI EducationItem type
interface EducationItem {
  id: string;
  institution: string;
  period: string;
  description: string;
  degree: string;
  images: string[];
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
    educationItems?: PrismaEducationItem[]; // Raw items from DB
  };
  onDataChange: () => void; // ADDED: Callback to trigger data refresh in parent
}

export default function EducationSection({
  section,
  onDataChange,
}: EducationSectionProps) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;
  const introTextBlock = section.textBlocks?.[0]; // Use the text block directly
  const sectionId = section.id;

  const [educationItems, setEducationItems] = useState<EducationItem[]>([]);

  // Handler for saving the section's intro TextBlock
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
      onDataChange(); // Refresh data
    } catch (error) {
      console.error("Error saving section intro text:", error);
    }
  };

  // Effect to map props to local state (remains the same)
  useEffect(() => {
    const mappedItems =
      section.educationItems?.map((apiItem) => ({
        id: String(apiItem.id),
        institution: apiItem.institution || "",
        period: apiItem.period || "",
        description: apiItem.description || "",
        degree: apiItem.degree || "",
        images:
          (apiItem as any).images && Array.isArray((apiItem as any).images)
            ? (apiItem as any).images.map((img: any) => String(img.src || "")) // Map image objects to src strings
            : [],
      })) || [];
    setEducationItems(mappedItems);
  }, [section.educationItems]);

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // State for education detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [currentEducation, setCurrentEducation] =
    useState<EducationItem | null>(null);

  // State for editing education fields
  const [isEditing, setIsEditing] = useState(false);
  const [editedInstitution, setEditedInstitution] = useState("");
  const [editedPeriod, setEditedPeriod] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedDegree, setEditedDegree] = useState(""); // Need state for degree too

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before drag starts - helps on touch devices
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Function to handle drag end
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
      setEducationItems(reorderedItems); // Optimistic UI update

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
        onDataChange(); // Refresh data from server to confirm order
      } catch (error) {
        console.error("Reordering failed:", error);
        // Optional: Rollback optimistic update here if needed by re-fetching
        onDataChange(); // Re-fetch to get original order on error
      }
    }
  };

  // Function to add a new education item
  const addNewEducationItem = async () => {
    // Prepare the data for the new item
    const newItemData = {
      sectionId: sectionId,
      institution: "NEW INSTITUTION",
      period: `${new Date().getFullYear()}-Present`,
      description: "Add details about this education here.",
      degree: "New Degree",
    };

    try {
      const response = await fetch("/api/education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItemData),
      });

      if (!response.ok) {
        throw new Error("Failed to add new education item");
      }
      // const addedItem = await response.json(); // Can use this if needed
      onDataChange(); // Trigger parent re-fetch to get the new item list
    } catch (error) {
      console.error("Adding education item failed:", error);
      // Handle error display to user if necessary
    }
  };

  // Function to open delete confirmation dialog
  const confirmDelete = (itemId: string) => {
    setItemToDelete(itemId);
    setDeleteDialogOpen(true);
  };

  // Function to delete an education item
  const deleteEducationItem = async () => {
    if (itemToDelete === null) return;
    const idToDelete = itemToDelete;

    // Optimistic UI update (optional, or remove after API call)
    // setEducationItems(educationItems.filter((item) => item.id !== idToDelete));
    setDeleteDialogOpen(false);
    setItemToDelete(null);

    try {
      const response = await fetch(`/api/education/${idToDelete}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Try to get error message
        throw new Error(errorData.message || "Failed to delete education item");
      }
      onDataChange(); // Trigger parent re-fetch
    } catch (error) {
      console.error("Deleting education item failed:", error);
      // Optional: Rollback optimistic update if used
      // Handle error display
      onDataChange(); // Re-fetch even on error to ensure UI consistency
    }
  };

  // Function to view education details
  const viewEducationDetails = (educationId: string) => {
    const education = educationItems.find((item) => item.id === educationId);
    if (education) {
      setCurrentEducation(education);
      setEditedInstitution(education.institution);
      setEditedPeriod(education.period);
      setEditedDescription(education.description);
      setEditedDegree(education.degree); // Set degree state
      setDetailDialogOpen(true);
    }
  };

  // Function to save edited education details
  const saveEducationDetails = async () => {
    if (!currentEducation) return;

    const updatedData = {
      institution: editedInstitution,
      period: editedPeriod,
      description: editedDescription,
      degree: editedDegree, // Include degree
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
      // const updatedItemFromServer = await response.json();
      setDetailDialogOpen(false); // Close dialog on success
      setIsEditing(false); // Assuming edit mode is toggled elsewhere or based on dialog state
      onDataChange(); // Trigger parent re-fetch
    } catch (error) {
      console.error("Updating education details failed:", error);
      // Handle error display
    }
  };

  // Function to add an image to education
  const addEducationImage = (file?: File) => {
    if (currentEducation) {
      let newImageUrl: string;

      if (file) {
        // In a real implementation, you would upload the file to storage
        // For now, we'll just create a temporary URL
        newImageUrl = URL.createObjectURL(file);
      } else {
        // Use a random image if no file is provided
        const randomId = Math.floor(Math.random() * 1000);
        newImageUrl = `https://picsum.photos/600/400?random=${randomId}`;
      }

      const updatedEducation = {
        ...currentEducation,
        images: [...currentEducation.images, newImageUrl],
      };

      setEducationItems(
        educationItems.map((item) =>
          item.id === currentEducation.id ? updatedEducation : item
        )
      );
      setCurrentEducation(updatedEducation);
    }
  };

  // Function to delete an image
  const deleteEducationImage = (index: number) => {
    if (currentEducation) {
      const updatedImages = [...currentEducation.images];
      updatedImages.splice(index, 1);

      const updatedEducation = {
        ...currentEducation,
        images: updatedImages,
      };

      setEducationItems(
        educationItems.map((item) =>
          item.id === currentEducation.id ? updatedEducation : item
        )
      );
      setCurrentEducation(updatedEducation);
    }
  };

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
              initialText={section.title || "EDUCATION"}
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

          {/* Education List and Controls */}
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

            {/* Add New Education Item Button - Only visible to admin */}
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
                  >
                    <PlusCircle size={16} />
                    Add Education
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Delete Confirmation Dialog */}
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
                    <Button variant="destructive" onClick={deleteEducationItem}>
                      Delete
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

      {/* Education Detail Dialog */}
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
                  {/* Institution and Period Fields */}
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

                  {/* Description */}
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

                  {/* Save Button for Admin */}
                  {isAdmin && (
                    <div className="flex justify-end">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button onClick={saveEducationDetails}>
                          Save Details
                        </Button>
                      </motion.div>
                    </div>
                  )}

                  {/* Education Images */}
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
                          >
                            <ImagePlus size={14} />
                            Add Random Image
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
                            key={`${image}-${index}`}
                            className="relative group"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            whileHover={{ scale: 1.03 }}
                          >
                            <Image
                              src={image || "https://picsum.photos/600/400"}
                              alt={`${currentEducation.institution} image ${
                                index + 1
                              }`}
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
                                  onClick={() => deleteEducationImage(index)}
                                >
                                  <X size={14} />
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
