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

// Define a project type for better type safety
interface Project {
  id: number;
  number: string;
  companyName: string;
  description1: string;
  description2?: string;
  imageSrc: string;
  layout: "layout1" | "layout2";
  categories: string[]; // Added categories field
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
}: {
  project: Project;
  index: number;
  projects: Project[];
  confirmDelete: (id: number) => void;
  onChangeLayout: (id: number, layout: "layout1" | "layout2") => void;
  showImages: boolean;
  onEditCategories: (id: number) => void;
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

  // Layout 1: Title on left, content on right
  // Layout 2: Title on right, content on left
  const isLayout1 = project.layout === "layout1";
  const bgColorClass = index % 2 === 0 ? "bg-red-600" : "bg-black";

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className="mb-16 md:mb-24"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <div className={`${bgColorClass} rounded-lg p-6 md:p-12`}>
        {isLayout1 ? (
          // Layout 1: PROJECT 01 on left, content on right
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
            {/* Project Title */}
            <div className="md:col-span-5 lg:col-span-4 relative">
              <div
                className="absolute -left-6 sm:-left-10 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing touch-manipulation"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-5 w-5 text-white hover:text-gray-200" />
              </div>

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

                {/* Project Categories */}
                {project.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {project.categories.map((category) => (
                      <span
                        key={category}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white/10 text-white"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {category}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Layout Toggle and Delete Button */}
              <div className="absolute top-0 right-0 flex items-center space-x-2">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-gray-200 hover:bg-red-700"
                    onClick={() => onEditCategories(project.id)}
                    title="Edit Categories"
                  >
                    <Tag size={20} />
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-gray-200 hover:bg-red-700"
                    onClick={() => onChangeLayout(project.id, "layout2")}
                    title="Switch to Layout 2"
                  >
                    <LayoutList size={20} />
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-gray-200 hover:bg-red-700"
                    onClick={() => confirmDelete(project.id)}
                  >
                    <Trash2 size={20} />
                    <span className="sr-only">Delete project</span>
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Project Content */}
            <div className="md:col-span-7 lg:col-span-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="min-h-[100px]">
                  {" "}
                  {/* Minimum height to prevent collapse */}
                  <EditableText
                    initialText={project.companyName}
                    as="h3"
                    className="font-bold uppercase mb-3 text-white"
                    initialFontSize={16}
                  />
                  <EditableText
                    initialText={project.description1}
                    className="text-white"
                    initialFontSize={14}
                  />
                </div>
                {showImages && (
                  <motion.div
                    className="overflow-hidden rounded-lg shadow-md"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.3 }}
                  >
                    <EditableImage
                      src={project.imageSrc}
                      alt={`Project ${project.number} image`}
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
          // Layout 2: Content on left, PROJECT 02 on right
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
            {/* Project Content */}
            <div className="md:col-span-7 lg:col-span-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <EditableText
                    initialText={project.companyName}
                    as="h3"
                    className="font-bold uppercase mb-3 text-sm sm:text-base text-white"
                    initialFontSize={16}
                  />
                  <EditableText
                    initialText={project.description1}
                    className="text-sm mb-4 text-white"
                    initialFontSize={14}
                  />
                  {project.description2 && (
                    <EditableText
                      initialText={project.description2}
                      className="text-sm text-white"
                      initialFontSize={14}
                    />
                  )}
                </div>
                <div>
                  {showImages && (
                    <motion.div
                      className="overflow-hidden rounded-lg shadow-md mb-4"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    >
                      <EditableImage
                        src={project.imageSrc}
                        alt={`Project ${project.number} image`}
                        width={400}
                        height={300}
                        className="w-full h-auto object-cover"
                      />
                    </motion.div>
                  )}
                  <EditableText
                    initialText="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquam justo et nibh venenatis aliquet."
                    className="text-sm text-white"
                    initialFontSize={14}
                  />
                </div>
              </div>
            </div>

            {/* Project Title */}
            <div className="md:col-span-5 lg:col-span-4 relative">
              <div
                className="absolute -right-6 sm:-right-10 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing touch-manipulation"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-5 w-5 text-white hover:text-gray-200" />
              </div>

              <div className="flex flex-col items-end">
                <div className="text-white text-sm font-medium mb-1">
                  PROJECT
                </div>
                <div className="text-white font-bold tracking-tighter leading-none">
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

                {/* Project Categories */}
                {project.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 justify-end">
                    {project.categories.map((category) => (
                      <span
                        key={category}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-white/10 text-white"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {category}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Layout Toggle and Delete Button */}
              <div className="absolute top-0 left-0 flex items-center space-x-2">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-gray-200 hover:bg-red-700"
                    onClick={() => onEditCategories(project.id)}
                    title="Edit Categories"
                  >
                    <Tag size={20} />
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-gray-200 hover:bg-red-700"
                    onClick={() => onChangeLayout(project.id, "layout1")}
                    title="Switch to Layout 1"
                  >
                    <LayoutGrid size={20} />
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-gray-200 hover:bg-red-700"
                    onClick={() => confirmDelete(project.id)}
                  >
                    <Trash2 size={20} />
                    <span className="sr-only">Delete project</span>
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ProjectsSection() {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;

  // Initialize with the two existing projects
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 1,
      number: "01",
      companyName: "LICERIA & CO.",
      description1:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquam justo et nibh venenatis aliquet. Morbi mollis risus dignissim sapien commodo, in venenatis felis tristique.",
      imageSrc: "https://picsum.photos/400/300?random=101",
      layout: "layout1",
      categories: ["Web Design", "Branding"],
    },
    {
      id: 2,
      number: "02",
      companyName: "WARIDERE INC.",
      description1:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquam justo et nibh venenatis aliquet. Morbi mollis risus dignissim sapien commodo, in venenatis felis tristique.",
      description2:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquam justo et nibh venenatis aliquet. Morbi mollis risus dignissim sapien commodo, in venenatis felis tristique.",
      imageSrc: "https://picsum.photos/400/300?random=102",
      layout: "layout2",
      categories: ["Mobile App", "UI/UX"],
    },
    {
      id: 3,
      number: "03",
      companyName: "NEXUS STUDIOS",
      description1:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquam justo et nibh venenatis aliquet. Morbi mollis risus dignissim sapien commodo, in venenatis felis tristique.",
      imageSrc: "https://picsum.photos/400/300?random=103",
      layout: "layout1",
      categories: ["Branding", "Print"],
    },
    {
      id: 4,
      number: "04",
      companyName: "QUANTUM LABS",
      description1:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquam justo et nibh venenatis aliquet. Morbi mollis risus dignissim sapien commodo, in venenatis felis tristique.",
      imageSrc: "https://picsum.photos/400/300?random=104",
      layout: "layout2",
      categories: ["Web Design", "Development"],
    },
  ]);

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);

  // State for image visibility toggle
  const [showImages, setShowImages] = useState(true);

  // State for category management
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(projects);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [projectCategoryDialogOpen, setProjectCategoryDialogOpen] =
    useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [categoryToEdit, setCategoryToEdit] = useState<string | null>(null);

  // Extract all unique categories from projects
  useEffect(() => {
    const categories = new Set<string>();
    projects.forEach((project) => {
      project.categories.forEach((category) => {
        categories.add(category);
      });
    });
    setAllCategories(Array.from(categories).sort());
  }, [projects]);

  // Filter projects when selected category changes
  useEffect(() => {
    if (selectedCategory === null) {
      setFilteredProjects(projects);
    } else {
      setFilteredProjects(
        projects.filter((project) =>
          project.categories.includes(selectedCategory)
        )
      );
    }
  }, [selectedCategory, projects]);

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
      setProjects((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        // Update project numbers after reordering
        const reorderedItems = arrayMove(items, oldIndex, newIndex);
        return reorderedItems.map((project, index) => ({
          ...project,
          number: String(index + 1).padStart(2, "0"),
        }));
      });
    }
  };

  // Function to add a new project
  const addNewProject = () => {
    const newProjectId =
      projects.length > 0 ? Math.max(...projects.map((p) => p.id)) + 1 : 1;
    const newProjectNumber = String(projects.length + 1).padStart(2, "0");

    const newProject: Project = {
      id: newProjectId,
      number: newProjectNumber,
      companyName: "NEW PROJECT",
      description1:
        "Add your project description here. Click the pencil icon to edit this text.",
      imageSrc: `https://picsum.photos/400/300?random=${Math.floor(
        Math.random() * 1000
      )}`,
      layout: "layout1", // Default to layout1
      categories: [], // Empty categories array
    };

    setProjects([...projects, newProject]);
  };

  // Function to open delete confirmation dialog
  const confirmDelete = (projectId: number) => {
    setProjectToDelete(projectId);
    setDeleteDialogOpen(true);
  };

  // Function to delete a project
  const deleteProject = () => {
    if (projectToDelete !== null) {
      const updatedProjects = projects
        .filter((project) => project.id !== projectToDelete)
        .map((project, index) => ({
          ...project,
          number: String(index + 1).padStart(2, "0"),
        }));

      setProjects(updatedProjects);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  // Function to change project layout
  const changeProjectLayout = (
    projectId: number,
    layout: "layout1" | "layout2"
  ) => {
    setProjects(
      projects.map((project) =>
        project.id === projectId ? { ...project, layout } : project
      )
    );
  };

  // Function to add a new category
  const addCategory = () => {
    if (newCategory && !allCategories.includes(newCategory)) {
      setAllCategories([...allCategories, newCategory].sort());
      setNewCategory("");
    }
  };

  // Function to delete a category
  const deleteCategory = (categoryToDelete: string) => {
    // Remove category from all projects
    const updatedProjects = projects.map((project) => ({
      ...project,
      categories: project.categories.filter((cat) => cat !== categoryToDelete),
    }));

    setProjects(updatedProjects);

    // Remove from allCategories
    setAllCategories(allCategories.filter((cat) => cat !== categoryToDelete));

    // Reset selected category if it was deleted
    if (selectedCategory === categoryToDelete) {
      setSelectedCategory(null);
    }
  };

  // Function to open category management dialog
  const openCategoryDialog = () => {
    setNewCategory("");
    setCategoryToEdit(null);
    setCategoryDialogOpen(true);
  };

  // Function to open project categories dialog
  const openProjectCategoriesDialog = (projectId: number) => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setCurrentProject(project);
      setProjectCategoryDialogOpen(true);
    }
  };

  // Function to save project categories
  const saveProjectCategories = (projectId: number, categories: string[]) => {
    setProjects(
      projects.map((project) =>
        project.id === projectId ? { ...project, categories } : project
      )
    );
  };

  // Function to add a new category and update all categories list
  const handleAddCategory = (category: string) => {
    if (!allCategories.includes(category)) {
      setAllCategories([...allCategories, category].sort());
    }
  };

  // Function to edit project categories
  const openEditProjectCategories = (projectId: number) => {
    openProjectCategoriesDialog(projectId);
  };

  return (
    <section
      id="projects"
      className="py-16 md:py-20 lg:py-24 bg-black shadow-sm dark:shadow-gray-900 dark:shadow-sm"
    >
      <div className="max-w-6xl mx-auto px-4 pl-6 sm:pl-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <AnimatedSection delay={0.1}>
            <h2 className="text-white text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-none">
              PROJECTS
            </h2>
            <div className="flex mt-4 ml-1">
              <div className="w-2 h-2 rounded-full bg-white mr-2"></div>
              <div className="w-2 h-2 rounded-full bg-white mr-2"></div>
              <div className="w-2 h-2 rounded-full bg-white"></div>
            </div>
          </AnimatedSection>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Image visibility toggle */}
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm p-3 rounded-lg">
              <Label htmlFor="show-images" className="text-white">
                {showImages ? "Hide Images" : "Show Images"}
              </Label>
              <Switch
                id="show-images"
                checked={showImages}
                onCheckedChange={setShowImages}
              />
              {showImages ? (
                <Eye size={18} className="text-white" />
              ) : (
                <EyeOff size={18} className="text-white/70" />
              )}
            </div>

            {/* Category management button (admin only) */}
            {isAdmin && (
              <Button
                variant="secondary"
                size="sm"
                onClick={openCategoryDialog}
              >
                <Tag className="h-4 w-4 mr-2" />
                Manage Categories
              </Button>
            )}
          </div>
        </div>

        {/* Category filter */}
        <AnimatedSection delay={0.3} className="mb-8">
          <CategoryFilter
            categories={allCategories}
            selectedCategory={selectedCategory}
            onChange={setSelectedCategory}
          />
        </AnimatedSection>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredProjects.map((project) => project.id)}
            strategy={verticalListSortingStrategy}
          >
            <AnimatePresence>
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project, index) => (
                  <SortableProjectItem
                    key={project.id}
                    project={project}
                    index={index}
                    projects={filteredProjects}
                    confirmDelete={confirmDelete}
                    onChangeLayout={changeProjectLayout}
                    showImages={showImages}
                    onEditCategories={openEditProjectCategories}
                  />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white/10 rounded-lg p-12 text-center"
                >
                  <p className="text-white text-lg">
                    No projects found in this category.
                  </p>
                  {selectedCategory && (
                    <Button
                      variant="outline"
                      className="mt-4 border-white text-white hover:bg-white/10"
                      onClick={() => setSelectedCategory(null)}
                    >
                      Show All Projects
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </SortableContext>
        </DndContext>

        {/* Add New Project Button (admin only) */}
        {isAdmin && (
          <motion.div
            className="mt-12 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.3 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={addNewProject}
                className="bg-white hover:bg-gray-100 text-red-600 flex items-center gap-2"
              >
                <PlusCircle size={18} />
                Add New Project
              </Button>
            </motion.div>
          </motion.div>
        )}
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
                    Are you sure you want to delete this project? This action
                    cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-start mt-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button variant="destructive" onClick={deleteProject}>
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

      {/* Category Management Dialog (admin only) */}
      <AnimatePresence>
        {categoryDialogOpen && isAdmin && (
          <Dialog
            open={categoryDialogOpen}
            onOpenChange={setCategoryDialogOpen}
          >
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Manage Categories</DialogTitle>
                <DialogDescription>
                  Add, edit, or remove project categories.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-4">
                {/* Add new category */}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="New category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addCategory} disabled={!newCategory.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                {/* Category list */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {allCategories.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">
                      No categories yet. Add your first category above.
                    </p>
                  ) : (
                    allCategories.map((category) => (
                      <div
                        key={category}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                      >
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 mr-2 text-gray-500" />
                          <span>{category}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteCategory(category)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {/* Usage information */}
                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
                  <p>
                    Categories are automatically applied to projects. You can
                    add or remove categories from projects by editing each
                    project.
                  </p>
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

      {currentProject && (
        <ProjectCategoryDialog
          open={projectCategoryDialogOpen}
          onOpenChange={setProjectCategoryDialogOpen}
          projectId={currentProject.id}
          projectName={currentProject.companyName}
          allCategories={allCategories}
          selectedCategories={currentProject.categories}
          onSave={saveProjectCategories}
          onAddCategory={handleAddCategory}
        />
      )}
    </section>
  );
}
