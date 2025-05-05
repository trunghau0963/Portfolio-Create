"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import EditableText from "../ui/editable-text"
import EditableImage from "../ui/editable-image"
import { Button } from "@/components/ui/button"
import { PlusCircle, Trash2, AlertCircle, GripVertical, X, Upload } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import AnimatedSection from "../ui/animated-section"
import { useAuth } from "@/context/auth-context"

// Define an experience type
interface Experience {
  id: number
  title: string
  company: string
  summary: string
  description: string
  imageSrc: string
  detailImages: string[]
}

// Image Upload Component
function ImageUploadArea({ onImageSelected }: { onImageSelected: (file: File) => void }) {
  const [isDraggingOver, setIsDraggingOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(true)
  }

  const handleDragLeave = () => {
    setIsDraggingOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type.startsWith("image/")) {
        onImageSelected(file)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelected(e.target.files[0])
    }
  }

  return (
    <div
      className={`drag-drop-area ${isDraggingOver ? "dragging-over" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input type="file" id="experience-image-upload" accept="image/*" className="hidden" onChange={handleFileChange} />
      <label htmlFor="experience-image-upload" className="cursor-pointer">
        <div className="flex flex-col items-center">
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">Click to select an image or drag and drop</p>
          <p className="text-xs text-gray-400 mt-2">(For this demo, we'll use a random image if no file is selected)</p>
        </div>
      </label>
    </div>
  )
}

// Sortable Experience Item Component
function SortableExperienceItem({
  experience,
  isAdmin,
  onView,
  confirmDelete,
  index,
}: {
  experience: Experience
  isAdmin: boolean | undefined
  onView: (id: number) => void
  confirmDelete: (id: number) => void
  index: number
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: experience.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 1 : 0,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`relative group sortable-item ${isDragging ? "dragging" : ""}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      {isAdmin && (
        <div className="absolute top-2 left-2 sortable-handle z-10" {...attributes} {...listeners}>
          <GripVertical className="h-5 w-5 text-white bg-gray-800/50 rounded-full p-1" />
        </div>
      )}

      <motion.div
        className="overflow-hidden rounded-lg shadow-md"
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="relative cursor-pointer transition-transform duration-300"
          onClick={() => onView(experience.id)}
        >
          <EditableImage
            src={experience.imageSrc}
            alt={experience.title}
            width={400}
            height={300}
            className="w-full h-auto object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-3">
            <div>
              <h3 className="text-white font-bold text-sm sm:text-base">{experience.company}</h3>
              <p className="text-white text-xs sm:text-sm">{experience.summary}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {isAdmin && (
        <motion.div
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="text-white bg-red-600/70 hover:bg-red-600 rounded-full p-1"
            onClick={(e) => {
              e.stopPropagation()
              confirmDelete(experience.id)
            }}
          >
            <Trash2 size={16} />
            <span className="sr-only">Delete experience</span>
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}

export default function ExperienceSection() {
  const { user } = useAuth()
  const isAdmin = user?.isAdmin

  // Initialize with existing experiences
  const [experiences, setExperiences] = useState<Experience[]>([
    {
      id: 1,
      title: "Senior Designer",
      company: "LICERIA & CO.",
      summary: "UI/UX Design Lead",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquam justo et nibh venenatis aliquet. Morbi mollis risus dignissim sapien commodo, in venenatis felis tristique. Praesent a quam quis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquam justo et nibh venenatis aliquet. Morbi mollis risus dignissim sapien commodo, in venenatis felis tristique.",
      imageSrc: "https://picsum.photos/300/200?random=1",
      detailImages: ["https://picsum.photos/600/400?random=11", "https://picsum.photos/600/400?random=12"],
    },
    {
      id: 2,
      title: "Product Designer",
      company: "WARIDERE INC.",
      summary: "Product Design & Strategy",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquam justo et nibh venenatis aliquet. Morbi mollis risus dignissim sapien commodo, in venenatis felis tristique. Praesent a quam quis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquam justo et nibh venenatis aliquet. Morbi mollis risus dignissim sapien commodo, in venenatis felis tristique.",
      imageSrc: "https://picsum.photos/300/200?random=2",
      detailImages: ["https://picsum.photos/600/400?random=21"],
    },
    {
      id: 3,
      title: "Creative Lead",
      company: "TAKING THE INITIATIVE",
      summary: "Creative Direction & Leadership",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquam justo et nibh venenatis aliquet. Morbi mollis risus dignissim sapien commodo, in venenatis felis tristique. Praesent a quam quis. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquam justo et nibh venenatis aliquet. Morbi mollis risus dignissim sapien commodo, in venenatis felis tristique.",
      imageSrc: "https://picsum.photos/300/200?random=3",
      detailImages: [
        "https://picsum.photos/600/400?random=31",
        "https://picsum.photos/600/400?random=32",
        "https://picsum.photos/600/400?random=33",
      ],
    },
  ])

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [experienceToDelete, setExperienceToDelete] = useState<number | null>(null)

  // State for experience detail view
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [currentExperience, setCurrentExperience] = useState<Experience | null>(null)

  // State for editing experience fields
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [editedCompany, setEditedCompany] = useState("")
  const [editedSummary, setEditedSummary] = useState("")
  const [editedDescription, setEditedDescription] = useState("")

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
      setExperiences((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Function to add a new experience
  const addNewExperience = () => {
    const newExperienceId = experiences.length > 0 ? Math.max(...experiences.map((exp) => exp.id)) + 1 : 1

    const newExperience: Experience = {
      id: newExperienceId,
      title: "NEW POSITION",
      company: "NEW COMPANY",
      summary: "Brief summary of role",
      description: "Add your experience description here. Click the edit button to modify this text.",
      imageSrc: `https://picsum.photos/300/200?random=${Math.floor(Math.random() * 1000)}`,
      detailImages: [],
    }

    setExperiences([...experiences, newExperience])
  }

  // Function to open delete confirmation dialog
  const confirmDelete = (experienceId: number) => {
    setExperienceToDelete(experienceId)
    setDeleteDialogOpen(true)
  }

  // Function to delete an experience
  const deleteExperience = () => {
    if (experienceToDelete !== null) {
      setExperiences(experiences.filter((exp) => exp.id !== experienceToDelete))
      setDeleteDialogOpen(false)
      setExperienceToDelete(null)
    }
  }

  // Function to view experience details
  const viewExperienceDetails = (experienceId: number) => {
    const experience = experiences.find((exp) => exp.id === experienceId)
    if (experience) {
      setCurrentExperience(experience)
      setEditedTitle(experience.title)
      setEditedCompany(experience.company)
      setEditedSummary(experience.summary)
      setEditedDescription(experience.description)
      setDetailDialogOpen(true)
    }
  }

  // Function to save edited experience details
  const saveExperienceDetails = () => {
    if (currentExperience) {
      const updatedExperience = {
        ...currentExperience,
        title: editedTitle,
        company: editedCompany,
        summary: editedSummary,
        description: editedDescription,
      }

      setExperiences(experiences.map((exp) => (exp.id === currentExperience.id ? updatedExperience : exp)))
      setCurrentExperience(updatedExperience)
      setIsEditing(false)
    }
  }

  // Function to add a detail image
  const addDetailImage = (file?: File) => {
    if (currentExperience) {
      let newImageUrl: string

      if (file) {
        // In a real implementation, you would upload the file to storage
        // For now, we'll just create a temporary URL
        newImageUrl = URL.createObjectURL(file)
      } else {
        // Use a random image if no file is provided
        const randomId = Math.floor(Math.random() * 1000)
        newImageUrl = `https://picsum.photos/600/400?random=${randomId}`
      }

      const updatedExperience = {
        ...currentExperience,
        detailImages: [...currentExperience.detailImages, newImageUrl],
      }

      setExperiences(experiences.map((exp) => (exp.id === currentExperience.id ? updatedExperience : exp)))
      setCurrentExperience(updatedExperience)
    }
  }

  // Function to delete a detail image
  const deleteDetailImage = (index: number) => {
    if (currentExperience) {
      const updatedImages = [...currentExperience.detailImages]
      updatedImages.splice(index, 1)

      const updatedExperience = {
        ...currentExperience,
        detailImages: updatedImages,
      }

      setExperiences(experiences.map((exp) => (exp.id === currentExperience.id ? updatedExperience : exp)))
      setCurrentExperience(updatedExperience)
    }
  }

  return (
    <section id="experience" className="shadow-sm dark:shadow-gray-900 dark:shadow-sm py-16 md:py-20 lg:py-24 bg-red-600 text-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* Title Row - Now at the top */}
        <div className="mb-12">
          <AnimatedSection delay={0.1}>
            <h2 className="text-white text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-none mb-6">
              EXPE&shy;RIENCE
            </h2>
            <div className="flex mt-4">
              <div className="w-2 h-2 rounded-full bg-white mr-2"></div>
              <div className="w-2 h-2 rounded-full bg-white mr-2"></div>
              <div className="w-2 h-2 rounded-full bg-white"></div>
            </div>
          </AnimatedSection>
        </div>

        {/* Content Row - Now below the title */}
        <div className="space-y-8">
          <AnimatedSection delay={0.3} variant="fadeInLeft">
            <div className="bg-red-700/30 backdrop-blur-sm rounded-lg p-6 shadow-md">
              <EditableText
                initialText="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquam justo et nibh venenatis aliquet. Morbi mollis risus dignissim sapien commodo, in venenatis felis tristique."
                className="text-sm"
              />
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.5} variant="fadeInLeft">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={experiences.map((exp) => exp.id)} strategy={verticalListSortingStrategy}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {experiences.map((experience, index) => (
                    <SortableExperienceItem
                      key={experience.id}
                      experience={experience}
                      isAdmin={isAdmin}
                      onView={viewExperienceDetails}
                      confirmDelete={confirmDelete}
                      index={index}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Add New Experience Button - Only visible to admin */}
            {isAdmin && (
              <motion.div
                className="mt-8 flex justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.3 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={addNewExperience}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <PlusCircle size={16} />
                    Add Experience
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatedSection>
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
                    Are you sure you want to delete this experience? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-start mt-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="destructive" onClick={deleteExperience}>
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

      {/* Experience Detail Dialog */}
      <AnimatePresence>
        {currentExperience && detailDialogOpen && (
          <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl font-bold">Experience Details</DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-6">
                  {/* Experience Fields */}
                  {isAdmin ? (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Position Title</Label>
                        <Input
                          id="title"
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={editedCompany}
                          onChange={(e) => setEditedCompany(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="summary">Summary</Label>
                        <Input
                          id="summary"
                          value={editedSummary}
                          onChange={(e) => setEditedSummary(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          className="min-h-[150px] mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-bold">{currentExperience.title}</h3>
                        <p className="text-base font-medium">{currentExperience.company}</p>
                        <p className="text-sm text-gray-500">{currentExperience.summary}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{currentExperience.description}</p>
                      </div>
                    </div>
                  )}

                  {/* Save Button for Admin */}
                  {isAdmin && (
                    <div className="flex justify-end">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button onClick={saveExperienceDetails}>Save Details</Button>
                      </motion.div>
                    </div>
                  )}

                  {/* Detail Images */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold">Project Images</h3>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                              onClick={() => addDetailImage()}
                            >
                              <PlusCircle size={14} />
                              Add Random Image
                            </Button>
                          </motion.div>
                        </div>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="mb-4">
                        <ImageUploadArea onImageSelected={(file) => addDetailImage(file)} />
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <AnimatePresence>
                        {currentExperience.detailImages.map((image, index) => (
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
                              alt={`${currentExperience.title} detail ${index + 1}`}
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
                                  onClick={() => deleteDetailImage(index)}
                                >
                                  <X size={14} />
                                  <span className="sr-only">Remove image</span>
                                </Button>
                              </motion.div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {currentExperience.detailImages.length === 0 && (
                        <div className="col-span-2 text-center py-8 border border-dashed rounded-md text-gray-400">
                          No project images available
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
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
  )
}
