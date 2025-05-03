"use client"

import { useState } from "react"
import EditableText from "../ui/editable-text"
import EditableImage from "../ui/editable-image"
import { Button } from "@/components/ui/button"
import { PlusCircle, Trash2, AlertCircle, GripVertical, LayoutGrid, LayoutList, Eye, EyeOff } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { motion, AnimatePresence } from "framer-motion"
import AnimatedSection from "../ui/animated-section"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

// Define a project type for better type safety
interface Project {
  id: number
  number: string
  companyName: string
  description1: string
  description2?: string
  imageSrc: string
  layout: "layout1" | "layout2" // Added layout property
}

// Sortable Project Item Component
function SortableProjectItem({
  project,
  index,
  projects,
  confirmDelete,
  onChangeLayout,
  showImages,
}: {
  project: Project
  index: number
  projects: Project[]
  confirmDelete: (id: number) => void
  onChangeLayout: (id: number, layout: "layout1" | "layout2") => void
  showImages: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 1 : 0,
    marginBottom: index < projects.length - 1 ? "2rem" : 0,
  }

  // Layout 1: Title on left, content on right
  // Layout 2: Title on right, content on left
  const isLayout1 = project.layout === "layout1"

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className="mb-16 md:mb-24"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <div className="bg-red-600 rounded-lg p-6 md:p-8">
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
                <div className="text-white text-sm font-medium mb-1">PROJECT</div>
                <div className="text-white text-6xl sm:text-7xl md:text-8xl font-bold tracking-tighter leading-none">
                  {project.number}
                </div>
                <div className="flex mt-4 ml-1">
                  <div className="w-2 h-2 rounded-full bg-white mr-2"></div>
                  <div className="w-2 h-2 rounded-full bg-white mr-2"></div>
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
              </div>

              {/* Layout Toggle and Delete Button */}
              <div className="absolute top-0 right-0 flex items-center space-x-2">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
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
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
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
                <div>
                  <EditableText
                    initialText={project.companyName}
                    as="h3"
                    className="font-bold uppercase mb-3 text-sm sm:text-base text-white"
                  />
                  <EditableText initialText={project.description1} className="text-sm mb-4 text-white" />
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
                  />
                  <EditableText initialText={project.description1} className="text-sm mb-4 text-white" />
                  {project.description2 && (
                    <EditableText initialText={project.description2} className="text-sm text-white" />
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
                  />
                </div>
              </div>
            </div>

            {/* Project Title */}
            <div className="md:col-span-5 lg:col-span-4 relative">
              <div
                className="absolute -left-6 sm:-left-10 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing touch-manipulation"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-5 w-5 text-white hover:text-gray-200" />
              </div>

              <div className="flex flex-col items-end">
                <div className="text-white text-sm font-medium mb-1">PROJECT</div>
                <div className="text-white text-6xl sm:text-7xl md:text-8xl font-bold tracking-tighter leading-none">
                  {project.number}
                </div>
                <div className="flex mt-4 ml-1">
                  <div className="w-2 h-2 rounded-full bg-white mr-2"></div>
                  <div className="w-2 h-2 rounded-full bg-white mr-2"></div>
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
              </div>

              {/* Layout Toggle and Delete Button */}
              <div className="absolute top-0 left-0 flex items-center space-x-2">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
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
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
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
  )
}

export default function ProjectsSection() {
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
    },
  ])

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null)

  // State for image visibility toggle
  const [showImages, setShowImages] = useState(true)

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before drag starts - helps on touch devices
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Function to handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setProjects((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        // Update project numbers after reordering
        const reorderedItems = arrayMove(items, oldIndex, newIndex)
        return reorderedItems.map((item, index) => ({
          ...item,
          number: String(index + 1).padStart(2, "0"),
        }))
      })
    }
  }

  // Function to add a new project
  const addNewProject = () => {
    const newProjectId = projects.length > 0 ? Math.max(...projects.map((p) => p.id)) + 1 : 1
    const newProjectNumber = String(projects.length + 1).padStart(2, "0")

    const newProject: Project = {
      id: newProjectId,
      number: newProjectNumber,
      companyName: "NEW PROJECT",
      description1: "Add your project description here. Click the pencil icon to edit this text.",
      imageSrc: `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 1000)}`,
      layout: "layout1", // Default to layout1
    }

    setProjects([...projects, newProject])
  }

  // Function to open delete confirmation dialog
  const confirmDelete = (projectId: number) => {
    setProjectToDelete(projectId)
    setDeleteDialogOpen(true)
  }

  // Function to delete a project
  const deleteProject = () => {
    if (projectToDelete !== null) {
      const updatedProjects = projects
        .filter((project) => project.id !== projectToDelete)
        .map((project, index) => ({
          ...project,
          number: String(index + 1).padStart(2, "0"),
        }))

      setProjects(updatedProjects)
      setDeleteDialogOpen(false)
      setProjectToDelete(null)
    }
  }

  // Function to change project layout
  const changeProjectLayout = (projectId: number, layout: "layout1" | "layout2") => {
    setProjects(projects.map((project) => (project.id === projectId ? { ...project, layout } : project)))
  }

  return (
    <section id="projects" className="py-16 md:py-20 lg:py-24 bg-red-600">
      <div className="max-w-6xl mx-auto px-4 pl-6 sm:pl-10">
        <div className="flex justify-between items-center mb-12">
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

          {/* Image visibility toggle */}
          <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm p-3 rounded-lg">
            <Label htmlFor="show-images" className="text-white">
              {showImages ? "Hide Images" : "Show Images"}
            </Label>
            <Switch id="show-images" checked={showImages} onCheckedChange={setShowImages} />
            {showImages ? <Eye size={18} className="text-white" /> : <EyeOff size={18} className="text-white/70" />}
          </div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={projects.map((project) => project.id)} strategy={verticalListSortingStrategy}>
            <div>
              {projects.map((project, index) => (
                <SortableProjectItem
                  key={project.id}
                  project={project}
                  index={index}
                  projects={projects}
                  confirmDelete={confirmDelete}
                  onChangeLayout={changeProjectLayout}
                  showImages={showImages}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Add New Project Button */}
        <motion.div
          className="mt-12 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.3 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={addNewProject} className="bg-white hover:bg-gray-100 text-red-600 flex items-center gap-2">
              <PlusCircle size={18} />
              Add New Project
            </Button>
          </motion.div>
        </motion.div>
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
                    Are you sure you want to delete this project? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-start mt-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="destructive" onClick={deleteProject}>
                      Delete
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                      Cancel
                    </Button>
                  </motion.div>
                </DialogFooter>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </section>
  )
}
