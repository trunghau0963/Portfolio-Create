"use client";

import { useState, useEffect } from "react";
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

// Define a project type for better type safety
interface Project {
  id: string;
  number: string;
  title: string;
  companyName?: string;
  description1: string;
  description2?: string;
  imageSrc: string;
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
  onSaveProjectText,
  onSaveProjectImage,
}: {
  project: Project;
  index: number;
  projects: Project[];
  confirmDelete: (id: string) => void;
  onChangeLayout: (id: string, layout: "layout1" | "layout2") => void;
  showImages: boolean;
  onEditCategories: (id: string) => void;
  isAdmin: boolean | undefined;
  onSaveProjectText: (
    projectId: string,
    field: keyof Project,
    newText: string,
    blockId?: string
  ) => Promise<void>;
  onSaveProjectImage: (
    projectId: string,
    field: "imageSrc",
    newData: { src?: string; alt?: string },
    blockId?: string
  ) => Promise<void>;
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

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`sortable-item ${isDragging ? "dragging" : ""}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <div className={`${bgColorClass} rounded-lg p-6 md:p-12`}>
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
                <div className="text-white font-bold tracking-tighter leading-none overflow-hidden">
                  <EditableText
                    initialText={project.number}
                    as="span"
                    initialFontSize={72}
                    className="text-white"
                  />
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
                      onClick={() => onEditCategories(project.id)}
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
                      onClick={() => onChangeLayout(project.id, "layout2")}
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
                      onClick={() => confirmDelete(project.id)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </motion.div>
                </div>
              )}
            </div>
            <div className="md:col-span-7 lg:col-span-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="min-h-[100px]">
                  <EditableText
                    initialText={project.title}
                    as="h3"
                    className="font-bold uppercase mb-2 text-white"
                    initialFontSize={18}
                  />
                  {project.companyName && (
                    <EditableText
                      initialText={project.companyName}
                      as="h4"
                      className="font-medium uppercase mb-3 text-white/80"
                      initialFontSize={15}
                    />
                  )}
                  <EditableText
                    initialText={project.description1}
                    className="text-white"
                    initialFontSize={14}
                  />
                  {project.description2 && (
                    <EditableText
                      initialText={project.description2}
                      className="text-white mt-2"
                      initialFontSize={14}
                    />
                  )}
                </div>
                {showImages && project.imageSrc && (
                  <motion.div
                    className="overflow-hidden rounded-lg shadow-md"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <EditableImage
                      src={project.imageSrc}
                      alt={project.title}
                      width={400}
                      height={300}
                      className="w-full h-auto object-cover"
                    />
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
            <div className="md:col-span-7 lg:col-span-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="min-h-[100px]">
                  <EditableText
                    initialText={project.title}
                    as="h3"
                    className="font-bold uppercase mb-2 text-white"
                    initialFontSize={18}
                  />
                  {project.companyName && (
                    <EditableText
                      initialText={project.companyName}
                      as="h4"
                      className="font-medium uppercase mb-3 text-white/80"
                      initialFontSize={15}
                    />
                  )}
                  <EditableText
                    initialText={project.description1}
                    className="text-white mb-2"
                    initialFontSize={14}
                  />
                  {project.description2 && (
                    <EditableText
                      initialText={project.description2}
                      className="text-white mt-2"
                      initialFontSize={14}
                    />
                  )}
                </div>
                {showImages && project.imageSrc && (
                  <motion.div
                    className="overflow-hidden rounded-lg shadow-md"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <EditableImage
                      src={project.imageSrc}
                      alt={project.title}
                      width={400}
                      height={300}
                      className="w-full h-auto object-cover"
                    />
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
                <div className="text-white font-bold tracking-tighter leading-none overflow-hidden">
                  <EditableText
                    initialText={project.number}
                    as="span"
                    initialFontSize={72}
                    className="text-white"
                  />
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
                      onClick={() => onEditCategories(project.id)}
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
                      onClick={() => onChangeLayout(project.id, "layout1")}
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
                      onClick={() => confirmDelete(project.id)}
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
  allCategoriesFromDB?: PrismaCategory[];
  onDataChange?: () => void;
}

export default function ProjectsSection({
  section,
  allCategoriesFromDB,
  onDataChange,
}: ProjectsSectionProps) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;
  const introTextBlock = section.textBlocks?.[0];

  const [projects, setProjects] = useState<Project[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
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
          errorData.message || "Failed to save text block for section"
        );
      }
      if (onDataChange) onDataChange();
      else {
        console.warn(
          "onDataChange not provided to ProjectsSection, UI might not reflect save immediately for intro text."
        );
      }
    } catch (error) {
      console.error("Error saving section text block:", error);
    }
  };

  const handleSaveProjectText = async (
    projectId: string,
    field: keyof Project,
    newText: string,
    blockId?: string
  ) => {
    console.log(
      `Saving text for project ${projectId}, field ${field}, text: ${newText}, blockId: ${blockId}`
    );
    if (
      blockId &&
      (field === "title" ||
        field === "companyName" ||
        field === "description1" ||
        field === "description2" ||
        field === "number")
    ) {
      try {
        const res = await fetch(`/api/textblocks/${blockId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newText }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.message ||
              `Failed to save ${field} (TextBlock ${blockId}) for project ${projectId}`
          );
        }
        if (onDataChange) onDataChange();
        else {
          setProjects((prev) =>
            prev.map((p) =>
              p.id === projectId ? { ...p, [field]: newText } : p
            )
          );
        }
      } catch (error) {
        console.error(
          `Error saving ${field} (TextBlock ${blockId}) for project ${projectId}:`,
          error
        );
        throw error;
      }
    } else {
      console.log(`Local update for project ${projectId}, field ${field}`);
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, [field]: newText } : p))
      );
    }
  };

  const handleSaveProjectImage = async (
    projectId: string,
    field: "imageSrc",
    newData: { src?: string; alt?: string },
    blockId?: string
  ) => {
    console.log(
      `Saving image for project ${projectId}, field ${field}, data: ${JSON.stringify(
        newData
      )}, blockId: ${blockId}`
    );
    if (blockId) {
      try {
        const res = await fetch(`/api/imageblocks/${blockId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newData),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.message ||
              `Failed to save image (ImageBlock ${blockId}) for project ${projectId}`
          );
        }
        if (onDataChange) onDataChange();
        else {
          setProjects((prev) =>
            prev.map((p) =>
              p.id === projectId
                ? { ...p, imageSrc: newData.src || p.imageSrc }
                : p
            )
          );
        }
      } catch (error) {
        console.error(
          `Error saving image (ImageBlock ${blockId}) for project ${projectId}:`,
          error
        );
        throw error;
      }
    } else {
      console.log(
        `Local update for project ${projectId}, field ${field} (image)`
      );
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, imageSrc: newData.src || p.imageSrc } : p
        )
      );
    }
  };

  useEffect(() => {
    const categoryMap = new Map<string, string>(
      allCategoriesFromDB?.map((cat: PrismaCategory) => [cat.id, cat.name]) ||
        []
    );

    const mappedProjects: Project[] =
      section.projectItems?.map((item: PrismaProjectItem): Project => {
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
          liveLink: item.liveLink || undefined,
          sourceLink: item.sourceLink || undefined,
          layout:
            item.layout === "layout1" || item.layout === "layout2"
              ? item.layout
              : "layout1",
          categories:
            item.categoryIds
              ?.map((id: string) => categoryMap.get(id) || id)
              .filter((name): name is string => !!name) || [],
          projectNumberBlockId: findBlockId("projectNumber"),
          titleBlockId: findBlockId("title"),
          companyNameBlockId: findBlockId("companyName"),
          description1BlockId: findBlockId("description1"),
          description2BlockId: findBlockId("description2"),
          mainImageBlockId: findImageBlockId("mainProjectImage"),
        };
      }) || [];
    setProjects(mappedProjects);

    const uniqueCategoryNames = new Set<string>();
    mappedProjects.forEach((p: Project) =>
      p.categories.forEach((catName: string) =>
        uniqueCategoryNames.add(catName)
      )
    );
    allCategoriesFromDB?.forEach((cat: PrismaCategory) =>
      uniqueCategoryNames.add(cat.name)
    );
    setAllCategories(Array.from(uniqueCategoryNames).sort());
  }, [section.projectItems, allCategoriesFromDB, section.textBlocks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && String(active.id) !== String(over.id)) {
      setProjects((items) => {
        const oldIndex = items.findIndex(
          (item) => String(item.id) === String(active.id)
        );
        const newIndex = items.findIndex(
          (item) => String(item.id) === String(over.id)
        );
        if (oldIndex === -1 || newIndex === -1) return items;
        console.log(
          "Reordering projects (API call needed)",
          items[oldIndex].title,
          "to",
          newIndex
        );
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addNewProject = () => {
    console.log("Add new project (API call needed)");
    const newProjectId = `new-project-${Date.now().toString()}`;
    const newProjectData: Project = {
      id: newProjectId,
      number: String(projects.length + 1).padStart(2, "0"),
      title: "NEW PROJECT",
      description1: "Enter project description here.",
      imageSrc: `https://picsum.photos/400/300?random=new${newProjectId}`,
      layout: "layout1",
      categories: [],
    };
    setProjects((prev) => [...prev, newProjectData]);
  };

  const confirmDelete = (projectId: string) => {
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  const deleteProject = () => {
    if (projectToDelete !== null) {
      console.log(`Deleting project ${projectToDelete} (API call needed)`);
      setProjects(projects.filter((project) => project.id !== projectToDelete));
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const changeProjectLayout = (
    projectId: string,
    layout: "layout1" | "layout2"
  ) => {
    console.log(
      `Changing layout for project ${projectId} to ${layout} (API call needed)`
    );
    setProjects(
      projects.map((project) =>
        project.id === projectId ? { ...project, layout } : project
      )
    );
  };

  const openGlobalCategoryDialog = () => setCategoryDialogOpen(true);
  const handleAddGlobalCategory = () => {
    console.log("Add global category (API call needed):", newCategoryName);
    if (
      newCategoryName.trim() &&
      !allCategories.includes(newCategoryName.trim())
    ) {
      setAllCategories((prev) => [...prev, newCategoryName.trim()].sort());
    }
    setNewCategoryName("");
  };
  const handleDeleteGlobalCategory = (catName: string) => {
    console.log("Delete global category (API call needed):", catName);
    setAllCategories((prev) => prev.filter((c) => c !== catName));
  };

  const openProjectSpecificCategoriesDialog = (projectId: string) => {
    const projectToEdit = projects.find((p) => p.id === projectId);
    if (projectToEdit) {
      setCurrentProjectForCategories(projectToEdit);
      setProjectCategoriesDialogOpen(true);
    }
  };

  const handleSaveProjectCategoriesForDialog = (
    projectIdAsNumber: number,
    updatedCategoryNames: string[]
  ) => {
    const projectIdAsString = String(projectIdAsNumber);
    console.log(
      "Save project categories (API call needed):",
      projectIdAsString,
      updatedCategoryNames
    );
    setProjects(
      projects.map((project) =>
        project.id === projectIdAsString
          ? { ...project, categories: updatedCategoryNames }
          : project
      )
    );
    setProjectCategoriesDialogOpen(false);
    const newUniqueCategories = new Set(allCategories);
    updatedCategoryNames.forEach((catName) => newUniqueCategories.add(catName));
    setAllCategories(Array.from(newUniqueCategories).sort());
  };

  const handleAddNewCategoryFromProjectDialog = (categoryName: string) => {
    console.log(
      "Add new category from project dialog (API call needed):",
      categoryName
    );
    if (categoryName.trim() && !allCategories.includes(categoryName.trim())) {
      setAllCategories([...allCategories, categoryName.trim()].sort());
    }
  };

  const filteredProjects = selectedCategory
    ? projects.filter((p) => p.categories.includes(selectedCategory))
    : projects;

  return (
    <AnimatedSection variant="fadeInUp">
      <section
        id={section.id}
        className="shadow-sm dark:shadow-gray-900 dark:shadow-sm py-16 md:py-20 lg:py-24 bg-black dark:bg-red-700"
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <EditableTextAutoResize
              initialText={section.title || "PROJECTS"}
              as="h1"
              className="text-red-600 text-5xl sm:text-[80px] md:text-[100px] lg:text-[135px] font-bold leading-none tracking-tighter mb-2"
            />
            {introTextBlock && (
              <EditableText
                initialText={introTextBlock.content}
                className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto"
                initialFontSize={14}
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
              {isAdmin && (
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
              )}
            </div>

            <div className="flex items-center space-x-2">
              {isAdmin && (
                <Button
                  onClick={openGlobalCategoryDialog}
                  variant="outline"
                  className="dark:text-white"
                >
                  <Tag className="mr-2 h-4 w-4" /> Manage Categories
                </Button>
              )}
              <CategoryFilter
                categories={allCategories}
                selectedCategory={selectedCategory}
                onChange={setSelectedCategory}
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
                    onSaveProjectText={handleSaveProjectText}
                    onSaveProjectImage={handleSaveProjectImage}
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
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Project
                </Button>
              </motion.div>
            </motion.div>
          )}

          {filteredProjects.length === 0 && selectedCategory && (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">
                No projects found for the category "{selectedCategory}".
              </p>
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
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
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
                  />
                  <Button onClick={handleAddGlobalCategory}>
                    <Plus className="mr-2 h-4 w-4" /> Add
                  </Button>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                  {allCategories.length > 0 ? (
                    allCategories.map((cat) => (
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
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))
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
          projectId={Number(currentProjectForCategories.id)}
          projectName={currentProjectForCategories.title}
          allCategories={allCategories}
          selectedCategories={currentProjectForCategories.categories}
          onSave={handleSaveProjectCategoriesForDialog}
          onAddCategory={handleAddNewCategoryFromProjectDialog}
        />
      )}
    </AnimatedSection>
  );
}
