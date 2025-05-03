"use client";

import { useState } from "react";
import EditableText from "../ui/editable-text";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical } from "lucide-react";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";

// Define an education item type with more details
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
  onViewDetails,
}: {
  item: EducationItem;
  index: number;
  items: EducationItem[];
  confirmDelete: (id: number) => void;
  onViewDetails: (id: number) => void;
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
    >
      <div
        className="grid grid-cols-12 gap-2 items-center py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => onViewDetails(item.id)}
      >
        <div
          className="col-span-1 cursor-grab active:cursor-grabbing touch-manipulation"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()} // Prevent opening details when dragging
        >
          <GripVertical className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        </div>

        <div className="col-span-7 md:col-span-8">
          <EditableText
            initialText={item.institution}
            as="div"
            className="font-bold uppercase text-sm sm:text-base"
          />
        </div>

        <div className="col-span-3 md:col-span-2 text-right">
          <EditableText
            initialText={item.period}
            as="div"
            className="text-sm italic"
          />
        </div>

        <div className="col-span-1">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation(); // Prevent opening details when deleting
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

export default function EducationDetailSection() {
  // Initialize with the existing education items, now with description and images
  const [educationItems, setEducationItems] = useState<EducationItem[]>([
    {
      id: 1,
      institution: "RIMBERIO UNIVERSITY",
      period: "2019-2020",
      description:
        "Bachelor of Arts in Graphic Design. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquam justo et nibh venenatis aliquet. Morbi mollis risus dignissim sapien commodo, in venenatis felis tristique.",
      images: ["https://picsum.photos/600/400?random=edu1"],
    },
    {
      id: 2,
      institution: "LAKANA UNIVERSITY",
      period: "2020-2021",
      description:
        "Master of Fine Arts. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquam justo et nibh venenatis aliquet. Morbi mollis risus dignissim sapien commodo, in venenatis felis tristique.",
      images: [
        "https://picsum.photos/600/400?random=edu2",
        "https://picsum.photos/600/400?random=edu3",
      ],
    },
    {
      id: 3,
      institution: "RIMBERIO UNIVERSITY",
      period: "2021-2022",
      description:
        "PhD in Design Theory. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquam justo et nibh venenatis aliquet. Morbi mollis risus dignissim sapien commodo, in venenatis felis tristique.",
      images: [],
    },
    {
      id: 4,
      institution: "WARIDERE UNIVERSITY",
      period: "2022-2023",
      description:
        "Post-Doctoral Research. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquam justo et nibh venenatis aliquet. Morbi mollis risus dignissim sapien commodo, in venenatis felis tristique.",
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
      updatedImages.splice(index, 1); // Remove the image at the specified index
      // TODO: Replace this with your actual state update logic
      // Example: setCurrentEducation({ ...currentEducation, images: updatedImages });
      console.log("Updated images after deletion:", updatedImages);
    }
  };
}
