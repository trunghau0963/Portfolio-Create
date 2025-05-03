"use client";

import { useState } from "react";
import EditableText from "../ui/editable-text";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Trash2,
  AlertCircle,
  GripVertical,
  Pencil,
  ImagePlus,
  X,
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
import AnimatedSection from "@/components/ui/animated-section";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

// Define an education item type
interface EducationItem {
  id: number;
  institution: string;
  period: string;
  description: string;
  images: string[];
}

// Sortable Education Item Component
function SortableEducationItem({
  item,
  index,
  items,
  confirmDelete,
  onView,
}: {
  item: EducationItem;
  index: number;
  items: EducationItem[];
  confirmDelete: (id: number) => void;
  onView: (id: number) => void;
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
      className="cursor-pointer hover:bg-gray-50 transition-colors"
    >
      <div className="grid grid-cols-12 gap-2 items-center py-3 border-b border-gray-200">
        <div
          className="col-span-1 cursor-grab active:cursor-grabbing touch-manipulation"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()} // Prevent opening dialog when grabbing
        >
          <GripVertical className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        </div>

        <div className="col-span-7 md:col-span-8">
          <EditableText
            initialText={item.institution}
            as="div"
            className="font-bold uppercase text-sm sm:text-base"
            // onClick={(e) => e.stopPropagation()} // Prevent opening dialog when editing
          />
        </div>

        <div className="col-span-3 md:col-span-2 text-right">
          <EditableText
            initialText={item.period}
            as="div"
            className="text-sm italic"
            // onClick={(e) => e.stopPropagation()} // Prevent opening dialog when editing
          />
        </div>

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
      </div>
    </motion.div>
  );
}

export default function EducationSection() {
  // Initialize with the existing education items
  const [educationItems, setEducationItems] = useState<EducationItem[]>([
    {
      id: 1,
      institution: "RIMBERIO UNIVERSITY",
      period: "2019-2020",
      description:
        "Bachelor's degree in Design. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquam justo et nibh venenatis aliquet.",
      images: [
        "https://picsum.photos/600/400?random=edu1",
        "https://picsum.photos/600/400?random=edu2",
      ],
    },
    {
      id: 2,
      institution: "LAKANA UNIVERSITY",
      period: "2020-2021",
      description:
        "Master's degree in Creative Arts. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquam justo et nibh venenatis aliquet.",
      images: ["https://picsum.photos/600/400?random=edu3"],
    },
    {
      id: 3,
      institution: "RIMBERIO UNIVERSITY",
      period: "2021-2022",
      description:
        "Advanced studies in Digital Design. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      images: [],
    },
    {
      id: 4,
      institution: "WARIDERE UNIVERSITY",
      period: "2022-2023",
      description:
        "PhD in Visual Communication. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      images: ["https://picsum.photos/600/400?random=edu4"],
    },
  ]);

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  // State for education detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [currentEducation, setCurrentEducation] =
    useState<EducationItem | null>(null);

  // State for editing education description
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");

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
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setEducationItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Function to add a new education item
  const addNewEducationItem = () => {
    const newItemId =
      educationItems.length > 0
        ? Math.max(...educationItems.map((item) => item.id)) + 1
        : 1;

    const newItem: EducationItem = {
      id: newItemId,
      institution: "NEW INSTITUTION",
      period: `${new Date().getFullYear()}-Present`,
      description: "Add details about this education here.",
      images: [],
    };

    setEducationItems([...educationItems, newItem]);
  };

  // Function to open delete confirmation dialog
  const confirmDelete = (itemId: number) => {
    setItemToDelete(itemId);
    setDeleteDialogOpen(true);
  };

  // Function to delete an education item
  const deleteEducationItem = () => {
    if (itemToDelete !== null) {
      setEducationItems(
        educationItems.filter((item) => item.id !== itemToDelete)
      );
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // Function to view education details
  const viewEducationDetails = (educationId: number) => {
    const education = educationItems.find((item) => item.id === educationId);
    if (education) {
      setCurrentEducation(education);
      setEditedDescription(education.description);
      setDetailDialogOpen(true);
    }
  };

  // Function to save edited description
  const saveDescription = () => {
    if (currentEducation) {
      setEducationItems(
        educationItems.map((item) =>
          item.id === currentEducation.id
            ? { ...item, description: editedDescription }
            : item
        )
      );
      setCurrentEducation({
        ...currentEducation,
        description: editedDescription,
      });
      setIsEditing(false);
    }
  };

  // Function to add an image to education
  const addEducationImage = () => {
    if (currentEducation) {
      // In a real implementation, you would handle file upload here
      // For now, we'll just add a random picsum image
      const randomId = Math.floor(Math.random() * 1000);
      const newImageUrl = `https://picsum.photos/600/400?random=${randomId}`;

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
    <section id="education" className="py-16 md:py-20 lg:py-24 bg-gray-100">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Title Column */}
          <div className="lg:col-span-4">
            <AnimatedSection delay={0.1}>
              <h2 className="text-red-600 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-none mb-6">
                EDU&shy;CATION
              </h2>
              <div className="flex mt-4">
                <div className="w-2 h-2 rounded-full bg-red-600 mr-2"></div>
                <div className="w-2 h-2 rounded-full bg-red-600 mr-2"></div>
                <div className="w-2 h-2 rounded-full bg-red-600"></div>
              </div>
            </AnimatedSection>
          </div>

          {/* Content Column */}
          <div className="lg:col-span-8">
            <div className="space-y-8">
              {/* Education List */}
              <AnimatedSection delay={0.3} direction="left">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
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
                          />
                        ))}
                      </AnimatePresence>
                    </SortableContext>
                  </DndContext>

                  {/* Add New Education Item Button */}
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
                        variant="outline"
                        className="border-red-600 text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <PlusCircle size={16} />
                        Add Education
                      </Button>
                    </motion.div>
                  </motion.div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </div>

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
                    {currentEducation.institution}
                  </DialogTitle>
                  <DialogDescription className="text-sm sm:text-base font-medium">
                    {currentEducation.period}
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                  {/* Description */}
                  <div className="relative">
                    {isEditing ? (
                      <motion.div
                        className="space-y-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Textarea
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          className="min-h-[150px]"
                        />
                        <div className="flex justify-end gap-2">
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsEditing(false)}
                            >
                              Cancel
                            </Button>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button size="sm" onClick={saveDescription}>
                              Save
                            </Button>
                          </motion.div>
                        </div>
                      </motion.div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-700 whitespace-pre-line">
                          {currentEducation.description}
                        </p>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="absolute top-0 right-0"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-gray-600"
                            onClick={() => setIsEditing(true)}
                          >
                            <Pencil size={16} />
                            <span className="sr-only">Edit description</span>
                          </Button>
                        </motion.div>
                      </div>
                    )}
                  </div>

                  {/* Education Images */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Education Images</h3>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={addEducationImage}
                        >
                          <ImagePlus size={14} />
                          Add Image
                        </Button>
                      </motion.div>
                    </div>

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
    </section>
  );
}
