"use client"

import { useState } from "react"
import EditableText from "../ui/editable-text"
import EditableImage from "../ui/editable-image"
import { Button } from "@/components/ui/button"
import { PlusCircle, Trash2, AlertCircle, GripVertical, LayoutGrid, Eye } from "lucide-react"
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

// Define a project type for better type safety
interface Project {
  id: number
  number: string
  companyName: string
  description1: string
  description2?: string
  imageSrc: string
  layout: "layout1" | "layout2" // layout1 = title on right, layout2 = title on left
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
  onChangeLayout: (id: number) => void
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

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className="mb-16 md:mb-24"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      {project.layout === "layout1" ? (
        // Layout 1: Title on right, large PROJECT text on left
        <div className="bg-red-600 text-white p-6 md:p-8 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 relative">
            {/* Drag handle */}
            <div
              className="absolute -left-6 sm:-left-10 top-8 cursor-grab active:cursor-grabbing touch-manipulation"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5 text-white/70 hover:text-white" />
            </div>

            {/* Layout toggle button */}
            <div className="absolute top-0 right-0 flex space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white/70 hover:text-white hover:bg-red-700/50"
                onClick={() => onChangeLayout(project.id)}
              >
                <LayoutGrid size={18} />
                <span className="sr-only">Change layout</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/70 hover:text-white hover:bg-red-700/50"
                onClick={() => confirmDelete(project.id)}
              >
                <Trash2 size={18} />
                <span className="sr-only">Delete project</span>
              </Button>
            </div>

            {/* Left column with PROJECT text */}
            <div className="md:col-span-5">
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

            {/* Right column with content */}
            <div className="md:col-span-7">
              <div className="space-y-6">
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
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.3 }}
                  >
                    <EditableImage
                      src={project.imageSrc}
                      alt={`Project ${project.number} image`}
                      width={400}
                      height={300}
                      className="w-full h-auto object-cover"
                      uploadPreset="portfolio"
                    />
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Layout 2: Title on left, large PROJECT text on right
        <div className="bg-red-600 text-white p-6 md:p-8 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 relative">
            {/* Drag handle */}
            <div
              className="absolute -left-6 sm:-left-10 top-8 cursor-grab active:cursor-grabbing touch-manipulation"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5 text-white/70 hover:text-white" />
            </div>

            {/* Layout toggle button */}
            <div className="absolute top-0 right-0 flex space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white/70 hover:text-white hover:bg-red-700/50"
                onClick={() => onChangeLayout(project.id)}
              >
                <LayoutGrid size={18} />
                <span className="sr-only">Change layout</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/70 hover:text-white hover:bg-red-700/50"
                onClick={() => confirmDelete(project.id)}
              >
                <Trash2 size={18} />
                <span className="sr-only">Delete project</span>
              </Button>
            </div>

            {/* Left column with content */}
            <div className="md:col-span-7 md:order-1 lg:order-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <EditableText initialText={project.description1} className="text-sm mb-4 text-white" />
                  {project.description2 && (
                    <EditableText initialText={project.description2} className="text-sm text-white" />
                  )}
                </div>
                <div>
                  <EditableText
                    initialText={project.companyName}
                    as="h3"
                    className="font-bold uppercase mb-3 text-sm sm:text-base text-white"
                  />
                  <EditableText
                    initialText="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquam justo et nibh venenatis aliquet."
                    className="text-sm mb-4 text-white"
                  />
                  {showImages && (
                    <motion.div
                      className="overflow-hidden rounded-lg shadow-md"
                      whileHover={{ scale: 1.03 }}
                      transition={{ duration: 0.3 }}
                    >
                      <EditableImage
                        src={project.imageSrc}
                        alt={`Project ${project.number} image`}
                        width={400}
                        height={300}
                        className="w-full h-auto object-cover"
                        uploadPreset="portfolio"
                      />
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column with PROJECT text */}
            <div className="md:col-span-5 md:order-2 lg:order-2">
              <div className="text-white text-6xl sm:text-7xl md:text-8xl font-bold tracking-tighter leading-none text-right">
                {project.number}
              </div>
              <div className="flex mt-4 justify-end">
                <div className="w-2 h-2 rounded-full bg-white mr-2"></div>
                <div className="w-2 h-2 rounded-full bg-white mr-2"></div>
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default function ProjectsRedSection() {
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

  // State for showing/hiding images
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
      layout: "layout1",
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

  // Function to toggle project layout
  const toggleProjectLayout = (projectId: number) => {
    setProjects(
      projects.map((project) => {
        if (project.id === projectId) {
          return {
            ...project,
            layout: project.layout === "layout1" ? "layout2" : "layout1",
          }
        }
        return project
      }),
    )
  }

  return (
    <section id="projects" className="py-16 md:py-20 lg:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 pl-6 sm:pl-10">
        <AnimatedSection delay={0.1}>
          <div className="mb-12 md:mb-16 flex justify-between items-end">
            <div>
              <h2 className="text-white bg-red-600 inline-block px-4 py-2 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-none">
                PROJECTS
              </h2>
              <div className="flex mt-4 ml-1">
                <div className="w-2 h-2 rounded-full bg-red-600 mr-2"></div>
                <div className="w-2 h-2 rounded-full bg-red-600 mr-2"></div>
                <div className="w-2 h-2 rounded-full bg-red-600"></div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Show Images</span>
              <Switch checked={showImages} onCheckedChange={setShowImages} />
              <Eye size={18} className={showImages ? "text-red-600" : "text-gray-400"} />
            </div>
          </div>
        </AnimatedSection>

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
                  onChangeLayout={toggleProjectLayout}
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
            <Button onClick={addNewProject} className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2">
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
