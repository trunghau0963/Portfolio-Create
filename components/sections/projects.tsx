"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import EditableText from "../ui/editable-text";
import EditableImage from "../ui/editable-image";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Trash2,
  AlertCircle,
  GripVertical,
  LayoutGrid,
  LayoutList,
  Eye,
  EyeOff,
  Tag,
  Plus,
  Loader2,
  Image as LucideImageIcon,
  ImagePlus,
  UploadCloud,
  Pencil,
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import CategoryFilter from "../ui/category-filter";
import { useAuth } from "@/context/auth-context";
import ProjectCategoryDialog from "../ui/project-category-dialog";
import {
  Section as PrismaSection,
  TextBlock as PrismaTextBlock,
  ProjectItem as PrismaProjectItem,
  Category as PrismaCategory,
} from "../../lib/generated/prisma";
import EditableTextAutoResize from "../ui/editable-text-auto-resize";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Image } from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";
import { CloudinaryUploadWidgetResults } from "next-cloudinary";
import NextImage from "next/image";

// Define a project type for better type safety
interface Project {
  id: string;
  number: string;
  title: string;
  companyName?: string;
  description1: string;
  description2?: string;
  imageSrc: string; // This will be Cloudinary URL
  imagePublicId?: string; // Add this for Cloudinary
  layout: "layout1" | "layout2";
  categories: string[];
  liveLink?: string;
  sourceLink?: string;
  titleBlockId?: string;
  companyNameBlockId?: string;
  description1BlockId?: string;
  description2BlockId?: string;
  projectNumberBlockId?: string;
  mainImageBlockId?: string;
}

// Define a category type with ID for mapping
interface CategoryWithId {
  id: string;
  name: string;
}

// Sortable Project Item Component
function SortableProjectItem({
  project,
  index,
  projects,
  confirmDelete,
  onChangeLayout,
  showImages,
  onEditCategories,
  isAdmin,
  onProjectImageUploaded,
  onViewDetails,
}: {
  project: Project;
  index: number;
  projects: Project[];
  confirmDelete: (id: string) => void;
  onChangeLayout: (id: string, layout: "layout1" | "layout2") => void;
  showImages: boolean;
  onEditCategories: (id: string) => void;
  isAdmin: boolean | undefined;
  onProjectImageUploaded: (
    projectId: string,
    imageData: { public_id: string; secure_url: string }
  ) => Promise<void>;
  onViewDetails: (project: Project) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 1 : 0,
    marginBottom: index < projects.length - 1 ? "2rem" : 0,
  };

  const isLayout1 = project.layout === "layout1";
  const bgColorClass = index % 2 === 0 ? "bg-red-600" : "bg-black";

  const handleImageUpload = async (imageData: {
    public_id: string;
    secure_url: string;
  }) => {
    await onProjectImageUploaded(project.id, imageData);
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`sortable-item ${isDragging ? "dragging" : ""}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <div className={`${bgColorClass} rounded-lg p-12 md:p-12`}>
        {isLayout1 ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
            <div className="md:col-span-5 lg:col-span-4 relative">
              {isAdmin && (
                <div
                  className="absolute -left-6 sm:-left-10 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing touch-manipulation z-10"
                  {...attributes}
                  {...listeners}
                >
                  <GripVertical className="h-5 w-5 text-white hover:text-gray-200" />
                </div>
              )}
              <div>
                <div className="text-white text-sm font-medium mb-1">
                  PROJECT
                </div>
                <div className="text-[72px] text-white font-bold tracking-tighter leading-none overflow-hidden">
                  <span>{project.number}</span>
                </div>
                <div className="flex mt-4 ml-1">
                  <div className="w-2 h-2 rounded-full bg-white mr-2"></div>
                  <div className="w-2 h-2 rounded-full bg-white mr-2"></div>
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
                {project.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {project.categories.map((categoryName) => (
                      <span
                        key={categoryName}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white/10 text-white"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {categoryName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {isAdmin && (
                <div className="absolute top-0 right-0 flex items-center space-x-1 sm:space-x-2">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:text-gray-200 hover:bg-red-700 p-1 sm:p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(project);
                      }}
                      title="Edit Project Details"
                    >
                      <Pencil size={18} />
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:text-gray-200 hover:bg-red-700 p-1 sm:p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditCategories(project.id);
                      }}
                      title="Edit Categories"
                    >
                      <Tag size={18} />
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:text-gray-200 hover:bg-red-700 p-1 sm:p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChangeLayout(project.id, "layout2");
                      }}
                      title="Switch to Layout 2"
                    >
                      <LayoutList size={18} />
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:text-gray-200 hover:bg-red-700 p-1 sm:p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(project.id);
                      }}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </motion.div>
                </div>
              )}
            </div>
            <div className="md:col-span-7 lg:col-span-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="min-h-[100px] text-white relative">
                  <h3 className="font-bold uppercase mb-2 text-base">
                    {project.title}
                  </h3>
                  {project.companyName && (
                    <h4 className="font-medium uppercase mb-3 text-sm text-white/80">
                      {project.companyName}
                    </h4>
                  )}
                  <p className="text-sm mb-2 whitespace-pre-line">
                    {project.description1}
                  </p>
                  {project.description2 && (
                    <p className="text-sm mt-2 whitespace-pre-line">
                      {project.description2}
                    </p>
                  )}
                </div>
                {showImages && (
                  <motion.div
                    className="overflow-hidden rounded-lg shadow-md aspect-[4/3]"
                    transition={{ duration: 0.3 }}
                  >
                    {isAdmin ? (
                      <EditableImage
                        src={project.imageSrc || "/placeholder.svg"}
                        alt={project.title}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover"
                        onImageUploaded={handleImageUpload}
                        uploadPreset="portfolio_unsigned"
                      />
                    ) : (
                      <NextImage
                        src={project.imageSrc || "/placeholder.svg"}
                        alt={project.title}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
            <div className="md:col-span-7 lg:col-span-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="min-h-[100px] text-white relative">
                  <h3 className="font-bold uppercase mb-2 text-base">
                    {project.title}
                  </h3>
                  {project.companyName && (
                    <h4 className="font-medium uppercase mb-3 text-sm text-white/80">
                      {project.companyName}
                    </h4>
                  )}
                  <p className="text-sm mb-2 whitespace-pre-line">
                    {project.description1}
                  </p>
                  {project.description2 && (
                    <p className="text-sm mt-2 whitespace-pre-line">
                      {project.description2}
                    </p>
                  )}
                </div>
                {showImages && (
                  <motion.div
                    className="overflow-hidden rounded-lg shadow-md aspect-[4/3]"
                    transition={{ duration: 0.3 }}
                  >
                    {isAdmin ? (
                      <EditableImage
                        src={project.imageSrc || "/placeholder.svg"}
                        alt={project.title}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover"
                        onImageUploaded={handleImageUpload}
                        uploadPreset="portfolio_unsigned"
                      />
                    ) : (
                      <NextImage
                        src={project.imageSrc || "/placeholder.svg"}
                        alt={project.title}
                        width={400}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </motion.div>
                )}
              </div>
            </div>
            <div className="md:col-span-5 lg:col-span-4 relative">
              {isAdmin && (
                <div
                  className="absolute -right-6 sm:-right-10 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing touch-manipulation z-10"
                  {...attributes}
                  {...listeners}
                >
                  <GripVertical className="h-5 w-5 text-white hover:text-gray-200" />
                </div>
              )}
              <div className="flex flex-col items-end text-right">
                <div className="text-white text-sm font-medium mb-1">
                  PROJECT
                </div>
                <div className="text-[72px] text-white font-bold tracking-tighter leading-none overflow-hidden">
                  <span>{project.number}</span>
                </div>
                <div className="flex mt-4 ml-1 self-end">
                  <div className="w-2 h-2 rounded-full bg-white mr-2"></div>
                  <div className="w-2 h-2 rounded-full bg-white mr-2"></div>
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
                {project.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 justify-end">
                    {project.categories.map((categoryName) => (
                      <span
                        key={categoryName}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white/10 text-white"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {categoryName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {isAdmin && (
                <div className="absolute top-0 left-0 flex items-center space-x-1 sm:space-x-2">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:text-gray-200 hover:bg-red-700 p-1 sm:p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(project);
                      }}
                      title="Edit Project Details"
                    >
                      <Pencil size={18} />
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:text-gray-200 hover:bg-red-700 p-1 sm:p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditCategories(project.id);
                      }}
                      title="Edit Categories"
                    >
                      <Tag size={18} />
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:text-gray-200 hover:bg-red-700 p-1 sm:p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChangeLayout(project.id, "layout1");
                      }}
                      title="Switch to Layout 1"
                    >
                      <LayoutGrid size={18} />
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:text-gray-200 hover:bg-red-700 p-1 sm:p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(project.id);
                      }}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface ProjectsSectionProps {
  section: PrismaSection & {
    textBlocks: PrismaTextBlock[];
    projectItems?: PrismaProjectItem[];
  };
  allCategoriesFromDB?: CategoryWithId[];
  onDataChange: () => void;
}

export default function ProjectsSection({
  section,
  allCategoriesFromDB,
  onDataChange,
}: ProjectsSectionProps) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;
  const introTextBlock = section.textBlocks?.[0];
  const sectionId = section.slug;

  const [projects, setProjects] = useState<Project[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allCategoriesWithId, setAllCategoriesWithId] = useState<CategoryWithId[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [showImages, setShowImages] = useState(true);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [projectCategoriesDialogOpen, setProjectCategoriesDialogOpen] =
    useState(false);
  const [currentProjectForCategories, setCurrentProjectForCategories] =
    useState<Project | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Dialog State for Project Details (text content only now)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [currentProjectInDialog, setCurrentProjectInDialog] =
    useState<Project | null>(null);
  const [editedNumber, setEditedNumber] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [editedCompanyName, setEditedCompanyName] = useState("");
  const [editedDescription1, setEditedDescription1] = useState("");
  const [editedDescription2, setEditedDescription2] = useState("");

  // Loading states
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [isReorderingProjects, setIsReorderingProjects] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [isChangingLayoutForId, setIsChangingLayoutForId] = useState<
    string | null
  >(null);
  const [isSavingProjectText, setIsSavingProjectText] = useState(false);
  // Category loading states
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isDeletingCategoryId, setIsDeletingCategoryId] = useState<
    string | null
  >(null);
  const [isSavingProjectCategories, setIsSavingProjectCategories] =
    useState(false);

  // Function handlers for text blocks and project details
  const handleSaveSectionTextBlock = async (blockId: string, content: string) => {
    try {
      const response = await fetch(`/api/text-blocks/${blockId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to update text block');
      if (onDataChange) onDataChange();
      toast.success('Text updated successfully');
    } catch (error) {
      console.error('Error updating text block:', error);
      toast.error('Failed to update text');
    }
  };

  const handleProjectImageUploaded = async (
    projectId: string,
    imageData: { public_id: string; secure_url: string }
  ) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageSrc: imageData.secure_url,
          imagePublicId: imageData.public_id,
        }),
      });
      if (!response.ok) throw new Error('Failed to update project image');
      if (onDataChange) onDataChange();
      toast.success('Image updated successfully');
    } catch (error) {
      console.error('Error updating project image:', error);
      toast.error('Failed to update image');
    }
  };

  const viewProjectDetails = (project: Project) => {
    setCurrentProjectInDialog(project);
    setEditedNumber(project.number);
    setEditedTitle(project.title);
    setEditedCompanyName(project.companyName || '');
    setEditedDescription1(project.description1);
    setEditedDescription2(project.description2 || '');
    setIsDetailDialogOpen(true);
  };

  const handleSaveProjectDetailsFromDialog = async () => {
    if (!currentProjectInDialog) return;
    setIsSavingProjectText(true);
    try {
      const response = await fetch(`/api/projects/${currentProjectInDialog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectNumber: editedNumber,
          title: editedTitle,
          companyName: editedCompanyName || null,
          description1: editedDescription1,
          description2: editedDescription2 || null,
        }),
      });
      if (!response.ok) throw new Error('Failed to update project details');
      if (onDataChange) onDataChange();
      toast.success('Project details updated successfully');
      setIsDetailDialogOpen(false);
    } catch (error) {
      console.error('Error updating project details:', error);
      toast.error('Failed to update project details');
    } finally {
      setIsSavingProjectText(false);
    }
  };

  // Fetch categories function
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const categories = await response.json();
      setAllCategoriesWithId(categories);
      setAllCategories(categories.map((c: CategoryWithId) => c.name).sort());
      
      // Reset selected category if it no longer exists
      if (selectedCategory && !categories.some((c: CategoryWithId) => c.name === selectedCategory)) {
        setSelectedCategory(null);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    }
  }, [selectedCategory]);

  // Initial data load
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Update projects when section data changes
  useEffect(() => {
    if (!section.projectItems || !allCategoriesWithId.length) return;

    const categoryMap = new Map<string, string>(
      allCategoriesWithId.map((cat) => [cat.id, cat.name])
    );

    const mappedProjects: Project[] = section.projectItems.map((item): Project => {
      const findBlockId = (purpose: string): string | undefined => undefined;
      const findImageBlockId = (purpose: string): string | undefined =>
        undefined;

      return {
        id: String(item.id),
        number: item.projectNumber || String(item.order + 1).padStart(2, "0"),
        title: item.title || "Untitled Project",
        companyName: item.companyName || undefined,
        description1: item.description1 || "",
        description2: item.description2 || undefined,
        imageSrc: item.imageSrc || "",
        imagePublicId: item.imagePublicId || undefined,
        liveLink: item.liveLink || undefined,
        sourceLink: item.sourceLink || undefined,
        layout:
          item.layout === "layout1" || item.layout === "layout2"
            ? item.layout
            : "layout1",
        categories:
          item.categoryIds
            ?.map((id) => categoryMap.get(id) || `Missing:${id}`)
            .filter((name) => !!name) || [],
        projectNumberBlockId: findBlockId("projectNumber"),
        titleBlockId: findBlockId("title"),
        companyNameBlockId: findBlockId("companyName"),
        description1BlockId: findBlockId("description1"),
        description2BlockId: findBlockId("description2"),
        mainImageBlockId: findImageBlockId("mainProjectImage"),
      };
    });

    setProjects(mappedProjects);
  }, [section.projectItems, allCategoriesWithId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && String(active.id) !== String(over.id)) {
      const oldIndex = projects.findIndex(
        (item) => String(item.id) === String(active.id)
      );
      const newIndex = projects.findIndex(
        (item) => String(item.id) === String(over.id)
      );
      if (oldIndex === -1 || newIndex === -1) return;

      const reorderedItems = arrayMove(projects, oldIndex, newIndex);
      const orderedIds = reorderedItems.map((item) => item.id);

      setProjects(reorderedItems);
      setIsReorderingProjects(true);

      try {
        const response = await fetch(
          `/api/sections/${section.id}/projects/reorder`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderedIds }),
          }
        );
        if (!response.ok) {
          throw new Error("Failed to reorder projects");
        }
        toast.success("Projects reordered!");
        if (onDataChange) onDataChange();
      } catch (error) {
        console.error("Reordering projects failed:", error);
        toast.error(`Reordering projects failed: ${(error as Error).message}`);
        if (onDataChange) onDataChange();
      } finally {
        setIsReorderingProjects(false);
      }
    }
  };

  const addNewProject = async () => {
    setIsAddingProject(true);
    const firstCategoryId = allCategoriesWithId.length > 0 ? allCategoriesWithId[0].id : undefined;

    const newProjectPayload = {
      sectionId: section.id,
      title: "NEW PROJECT",
      description1: "Enter project description here.",
      imageSrc: "",
      imagePublicId: null,
      layout: "layout1" as "layout1" | "layout2",
      categoryIds: firstCategoryId ? [firstCategoryId] : [],
    };
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProjectPayload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add new project");
      }
      toast.success("New project added! You can now upload an image.");
      
      // Ensure data is refreshed after successful creation
      if (onDataChange) {
        await onDataChange();
      }
    } catch (error) {
      console.error("Adding project failed:", error);
      toast.error(`Adding project failed: ${(error as Error).message}`);
    } finally {
      setIsAddingProject(false);
    }
  };

  const confirmDelete = (projectId: string) => {
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const deleteProject = async () => {
    if (projectToDelete === null) return;
    const idToDelete = projectToDelete;
    setIsDeletingProject(true);
    setDeleteDialogOpen(false);
    setProjectToDelete(null);

    try {
      const response = await fetch(`/api/projects/${idToDelete}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete project");
      }
      toast.success("Project deleted!");
      
      // Ensure data is refreshed after successful deletion
      if (onDataChange) {
        await onDataChange();
      }
    } catch (error) {
      console.error(`Deleting project ${idToDelete} failed:`, error);
      toast.error(`Deleting project failed: ${(error as Error).message}`);
    } finally {
      setIsDeletingProject(false);
    }
  };

  const changeProjectLayout = async (
    projectId: string,
    layout: "layout1" | "layout2"
  ) => {
    setIsChangingLayoutForId(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to change project layout");
      }
      toast.success("Project layout changed!");
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error(`Changing layout for project ${projectId} failed:`, error);
      toast.error(`Changing layout failed: ${(error as Error).message}`);
    } finally {
      setIsChangingLayoutForId(null);
    }
  };

  const openGlobalCategoryDialog = () => setCategoryDialogOpen(true);

  const handleAddGlobalCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsAddingCategory(true);
    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const addedCategory = await response.json();
      if (!response.ok) {
        throw new Error(addedCategory.message || "Failed to add category");
      }
      
      toast.success(`Category "${addedCategory.name}" added!`);
      setNewCategoryName("");
      
      // Fetch fresh categories
      await fetchCategories();
      
      // Update parent component
      if (onDataChange) {
        await onDataChange();
      }
    } catch (error) {
      console.error("Error adding global category:", error);
      toast.error(`Adding category failed: ${(error as Error).message}`);
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleDeleteGlobalCategory = async (catName: string) => {
    const categoryToDelete = allCategoriesWithId.find((c) => c.name === catName);
    if (!categoryToDelete) {
      toast.error(`Could not find category ID for "${catName}"`);
      return;
    }
    
    const categoryIdToDelete = categoryToDelete.id;
    setIsDeletingCategoryId(categoryIdToDelete);
    
    try {
      const response = await fetch(`/api/categories/${categoryIdToDelete}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete category");
      }
      
      toast.success(`Category "${catName}" deleted!`);
      
      // Fetch fresh categories
      await fetchCategories();
      
      // Update parent component
      if (onDataChange) {
        await onDataChange();
      }
    } catch (error) {
      console.error("Error deleting global category:", error);
      toast.error(`Deleting category failed: ${(error as Error).message}`);
    } finally {
      setIsDeletingCategoryId(null);
    }
  };

  const openProjectSpecificCategoriesDialog = (projectId: string) => {
    // Ensure project data includes original category IDs if needed,
    // otherwise rely on the mapping from names back to IDs
    const projectToEdit = projects.find((p) => p.id === projectId);
    if (projectToEdit) {
      setCurrentProjectForCategories(projectToEdit);
      setProjectCategoriesDialogOpen(true);
    }
  };

  const handleSaveProjectCategoriesForDialog = async (
    projectId: string,
    updatedCategoryNames: string[]
  ) => {
    setIsSavingProjectCategories(true);
    const nameToIdMap = new Map(allCategoriesWithId.map((c) => [c.name, c.id]));
    const updatedCategoryIds = updatedCategoryNames
      .map((name) => nameToIdMap.get(name))
      .filter((id): id is string => !!id);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryIds: updatedCategoryIds }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update project categories");
      }
      
      toast.success("Project categories updated!");
      setProjectCategoriesDialogOpen(false);
      setCurrentProjectForCategories(null);
      
      // Fetch fresh categories
      await fetchCategories();
      
      // Update parent component
      if (onDataChange) {
        await onDataChange();
      }
    } catch (error) {
      console.error(`Error saving categories for project ${projectId}:`, error);
      toast.error(`Updating categories failed: ${(error as Error).message}`);
    } finally {
      setIsSavingProjectCategories(false);
    }
  };

  // This function might be redundant if ProjectCategoryDialog uses handleAddGlobalCategory
  // Or it can be kept if adding a category from project context should behave differently
  const handleAddNewCategoryFromProjectDialog = async (
    categoryName: string
  ) => {
    // Re-use global add logic
    setNewCategoryName(categoryName); // Set the name
    await handleAddGlobalCategory(); // Call the existing handler
    // No need to update allCategories locally if onDataChange re-fetches
  };

  const filteredProjects = useMemo(() => {
    if (selectedCategory === null) {
      if (isAdmin) {
        return projects; // Admin selected "All" (represented by null)
      }
      // setSelectedCategory(allCategories.length > 0 ? allCategories[0] : ""); // Non-admin, default to first category if available
      return projects.filter((p) => p.categories.includes(allCategories.length > 0 ? allCategories[0] : "")); // Non-admin, nothing selected or "All" is not an option for them to select to get here
    }
    // A specific category is selected by any user
    return projects.filter((p) => p.categories.includes(selectedCategory));
  }, [projects, selectedCategory, isAdmin, allCategories]);

  return (
    <AnimatedSection variant="fadeInUp">
      <section
        id={sectionId}
        className="shadow-sm dark:shadow-gray-900 dark:shadow-sm py-16 md:py-20 lg:py-24 bg-black dark:bg-red-700"
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <EditableTextAutoResize
              initialText={section.title || "PROJECTS"}
              as="h1"
              className="text-red-700 text-5xl sm:text-[80px] md:text-[100px] lg:text-[135px] font-bold leading-none tracking-tighter mb-2"
            />
            {introTextBlock && (
              <EditableText
                key={introTextBlock.id}
                blockId={introTextBlock.id}
                initialText={introTextBlock.content}
                initialFontSize={introTextBlock.fontSize || 14}
                initialFontFamily={introTextBlock.fontFamily || "font-sans"}
                className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto"
                onCommitText={handleSaveSectionTextBlock}
              />
            )}
            {!introTextBlock && isAdmin && (
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Intro text block missing. Add one via section manager or Prisma
                Studio.
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 md:mb-12 gap-4">
            <div className="flex items-center space-x-4">
              {/* {isAdmin && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-images-toggle"
                    checked={showImages}
                    onCheckedChange={setShowImages}
                    aria-label={showImages ? "Hide images" : "Show images"}
                  />
                  <Label
                    htmlFor="show-images-toggle"
                    className="text-sm text-gray-600 dark:text-gray-300"
                  >
                    {showImages ? (
                      <Eye className="inline mr-1 h-4 w-4" />
                    ) : (
                      <EyeOff className="inline mr-1 h-4 w-4" />
                    )}
                    Images
                  </Label>
                </div>
              )} */}
              {isAdmin && (
                <Button
                  onClick={openGlobalCategoryDialog}
                  variant="outline"
                  className="dark:text-white"
                >
                  <Tag className="mr-2 h-4 w-4" /> Manage Categories
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* {isAdmin && (
                <Button
                  onClick={openGlobalCategoryDialog}
                  variant="outline"
                  className="dark:text-white"
                >
                  <Tag className="mr-2 h-4 w-4" /> Manage Categories
                </Button>
              )} */}
              <CategoryFilter
                categories={allCategories}
                selectedCategory={selectedCategory}
                onChange={setSelectedCategory}
                showAllOption={isAdmin}
              />
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredProjects.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-16 md:space-y-24">
                {filteredProjects.map((projectItem, index) => (
                  <SortableProjectItem
                    key={projectItem.id}
                    project={projectItem}
                    index={index}
                    projects={filteredProjects}
                    confirmDelete={confirmDelete}
                    onChangeLayout={changeProjectLayout}
                    showImages={showImages}
                    onEditCategories={openProjectSpecificCategoriesDialog}
                    isAdmin={isAdmin}
                    onProjectImageUploaded={handleProjectImageUploaded}
                    onViewDetails={viewProjectDetails}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {isAdmin && (
            <motion.div
              className="mt-12 flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={addNewProject}
                  variant="outline"
                  className="dark:text-white bg-white hover:bg-gray-100 text-red-600"
                  disabled={isAddingProject}
                >
                  {isAddingProject ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PlusCircle className="mr-2 h-4 w-4" />
                  )}
                  {isAddingProject ? "Adding..." : "Add Project"}
                </Button>
              </motion.div>
            </motion.div>
          )}

          {filteredProjects.length === 0 && (
            <div className="text-center py-10">
              {selectedCategory === null && !isAdmin ? (
                <p className="text-gray-500 dark:text-gray-400">
                  Please select a category to view projects.
                </p>
              ) : selectedCategory !== null ? (
                <p className="text-gray-500 dark:text-gray-400">
                  No projects found for the category "{selectedCategory}".
                </p>
              ) : isAdmin && projects.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">
                  No projects have been added to the portfolio yet.
                </p>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {deleteDialogOpen && (
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this project? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="sm:justify-start">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={deleteProject}
                  disabled={isDeletingProject}
                >
                  {isDeletingProject ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  {isDeletingProject ? "Deleting..." : "Delete"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {categoryDialogOpen && (
          <Dialog
            open={categoryDialogOpen}
            onOpenChange={setCategoryDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manage Categories</DialogTitle>
                <DialogDescription>
                  Add or delete global categories for projects.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="flex space-x-2">
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category name"
                    disabled={isAddingCategory} // Disable input while adding
                  />
                  <Button
                    onClick={handleAddGlobalCategory}
                    disabled={isAddingCategory || !newCategoryName.trim()}
                  >
                    {isAddingCategory ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    {isAddingCategory ? "Adding..." : "Add"}
                  </Button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                  {allCategories.length > 0 ? (
                    allCategories.map((cat) => {
                      const catId = allCategoriesWithId.find(
                        (c) => c.name === cat
                      )?.id;
                      const isDeletingThis = isDeletingCategoryId === catId;
                      return (
                        <div
                          key={cat}
                          className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded"
                        >
                          <span>{cat}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteGlobalCategory(cat)}
                            title="Delete category"
                            disabled={isDeletingThis} // Disable button while deleting this category
                          >
                            {isDeletingThis ? (
                              <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-red-500" />
                            )}
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500">
                      No categories added yet.
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCategoryDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {currentProjectForCategories && (
        <ProjectCategoryDialog
          open={projectCategoriesDialogOpen}
          onOpenChange={setProjectCategoriesDialogOpen}
          projectId={currentProjectForCategories.id} // Pass string ID directly
          projectName={currentProjectForCategories.title}
          allCategories={allCategories} // Pass names
          selectedCategories={currentProjectForCategories.categories} // Pass names
          onSave={handleSaveProjectCategoriesForDialog} // Pass handler directly
          onAddCategory={handleAddNewCategoryFromProjectDialog} // Add handler
        />
      )}

      {/* Project Detail Dialog */}
      <AnimatePresence>
        {isDetailDialogOpen && currentProjectInDialog && (
          <Dialog
            open={isDetailDialogOpen}
            onOpenChange={setIsDetailDialogOpen}
          >
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl font-bold">
                    Project Details
                  </DialogTitle>
                  <DialogDescription>
                    View details for "{currentProjectInDialog.title}".
                    {isAdmin && " You can edit the fields below."}
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="projNumber">Project Number</Label>
                      {isAdmin ? (
                        <Input
                          id="projNumber"
                          value={editedNumber}
                          onChange={(e) => setEditedNumber(e.target.value)}
                          className="mt-1"
                          disabled={isSavingProjectText}
                        />
                      ) : (
                        <p className="mt-1 font-semibold">
                          {currentProjectInDialog.number}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="projTitle">Title</Label>
                      {isAdmin ? (
                        <Input
                          id="projTitle"
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          className="mt-1"
                          disabled={isSavingProjectText}
                        />
                      ) : (
                        <p className="mt-1 font-semibold">
                          {currentProjectInDialog.title}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="projCompany">
                        Company Name (Optional)
                      </Label>
                      {isAdmin ? (
                        <Input
                          id="projCompany"
                          value={editedCompanyName}
                          onChange={(e) => setEditedCompanyName(e.target.value)}
                          className="mt-1"
                          disabled={isSavingProjectText}
                        />
                      ) : (
                        <p className="mt-1">
                          {currentProjectInDialog.companyName || "N/A"}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="projDesc1">Description 1</Label>
                      {isAdmin ? (
                        <Textarea
                          id="projDesc1"
                          value={editedDescription1}
                          onChange={(e) =>
                            setEditedDescription1(e.target.value)
                          }
                          className="mt-1 min-h-[100px]"
                          disabled={isSavingProjectText}
                        />
                      ) : (
                        <p className="mt-1 whitespace-pre-line">
                          {currentProjectInDialog.description1}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="projDesc2">
                        Description 2 (Optional)
                      </Label>
                      {isAdmin ? (
                        <Textarea
                          id="projDesc2"
                          value={editedDescription2}
                          onChange={(e) =>
                            setEditedDescription2(e.target.value)
                          }
                          className="mt-1 min-h-[60px]"
                          disabled={isSavingProjectText}
                        />
                      ) : (
                        <p className="mt-1 whitespace-pre-line">
                          {currentProjectInDialog.description2 || "N/A"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <DialogFooter className="mt-6">
                  {isAdmin && (
                    <Button
                      onClick={handleSaveProjectDetailsFromDialog}
                      disabled={isSavingProjectText}
                    >
                      {isSavingProjectText ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {isSavingProjectText ? "Saving..." : "Save Changes"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailDialogOpen(false)}
                    disabled={isSavingProjectText}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </AnimatedSection>
  );
}
