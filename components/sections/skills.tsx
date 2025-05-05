"use client"

import type React from "react"

import { useState } from "react"
import EditableText from "../ui/editable-text"
import { Button } from "@/components/ui/button"
import { PlusCircle, Trash2, AlertCircle, GripVertical, ImagePlus, X, Upload } from "lucide-react"
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
import Image from "next/image"
import { useAuth } from "@/context/auth-context"

// Define a skill type
interface Skill {
  id: number
  title: string
  description: string
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
      <input type="file" id="skill-image-upload" accept="image/*" className="hidden" onChange={handleFileChange} />
      <label htmlFor="skill-image-upload" className="cursor-pointer">
        <div className="flex flex-col items-center">
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">Click to select an image or drag and drop</p>
          <p className="text-xs text-gray-400 mt-2">(For this demo, we'll use a random image if no file is selected)</p>
        </div>
      </label>
    </div>
  )
}

// Sortable Skill Item Component
function SortableSkillItem({
  skill,
  confirmDelete,
  index,
  isAdmin,
}: {
  skill: Skill
  confirmDelete: (id: number) => void
  index: number
  isAdmin: boolean | undefined
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: skill.id })

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
      className={`flex items-start mb-6 sortable-item ${isDragging ? "dragging" : ""}`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      {isAdmin && (
        <div className="mr-2 sortable-handle mt-1" {...attributes} {...listeners}>
          <GripVertical className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        </div>
      )}
      <motion.div
        className="w-3 h-3 rounded-full bg-red-600 mt-1 mr-3 flex-shrink-0"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
      ></motion.div>
      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <EditableText initialText={skill.title} as="h3" className="font-bold uppercase mb-2" initialFontSize={16} />
          {isAdmin && (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                className="ml-2 text-gray-400 hover:text-red-600 hover:bg-transparent"
                onClick={() => confirmDelete(skill.id)}
              >
                <Trash2 size={16} />
                <span className="sr-only">Delete skill</span>
              </Button>
            </motion.div>
          )}
        </div>
        <EditableText initialText={skill.description} initialFontSize={14} />
      </div>
    </motion.div>
  )
}

export default function SkillsSection() {
  const { user } = useAuth()
  const isAdmin = user?.isAdmin

  // Initialize with existing skills
  const [skills, setSkills] = useState<Skill[]>([
    {
      id: 1,
      title: "TYPOGRAPHY",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquam justo et nibh venenatis aliquet. Morbi mollis risus dignissim sapien commodo, in venenatis felis tristique.",
    },
    {
      id: 2,
      title: "LAYOUT & COMPOSITION",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc aliquam justo et nibh venenatis aliquet. Morbi mollis risus dignissim sapien commodo, in venenatis felis tristique.",
    },
  ])

  // State for skill images
  const [skillImages, setSkillImages] = useState([
    "https://picsum.photos/400/300?random=skill1",
    "https://picsum.photos/400/300?random=skill2",
  ])

  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [skillToDelete, setSkillToDelete] = useState<number | null>(null)

  // State for image management dialog
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<number | null>(null)
  const [imageDeleteDialogOpen, setImageDeleteDialogOpen] = useState(false)

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
      setSkills((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Function to add a new skill
  const addNewSkill = () => {
    const newSkillId = skills.length > 0 ? Math.max(...skills.map((skill) => skill.id)) + 1 : 1

    const newSkill: Skill = {
      id: newSkillId,
      title: "NEW SKILL",
      description: "Add your skill description here. Click the pencil icon to edit this text.",
    }

    setSkills([...skills, newSkill])
  }

  // Function to open delete confirmation dialog
  const confirmDelete = (skillId: number) => {
    setSkillToDelete(skillId)
    setDeleteDialogOpen(true)
  }

  // Function to delete a skill
  const deleteSkill = () => {
    if (skillToDelete !== null) {
      setSkills(skills.filter((skill) => skill.id !== skillToDelete))
      setDeleteDialogOpen(false)
      setSkillToDelete(null)
    }
  }

  // Function to add a new skill image
  const addSkillImage = (file?: File) => {
    let newImageUrl: string

    if (file) {
      // In a real implementation, you would upload the file to storage
      // For now, we'll just create a temporary URL
      newImageUrl = URL.createObjectURL(file)
    } else {
      // Use a random image if no file is provided
      const randomId = Math.floor(Math.random() * 1000)
      newImageUrl = `https://picsum.photos/400/300?random=${randomId}`
    }

    setSkillImages([...skillImages, newImageUrl])
    setImageDialogOpen(false)
  }

  // Function to confirm image deletion
  const confirmDeleteImage = (index: number) => {
    setImageToDelete(index)
    setImageDeleteDialogOpen(true)
  }

  // Function to delete a skill image
  const deleteSkillImage = () => {
    if (imageToDelete !== null) {
      const updatedImages = [...skillImages]
      updatedImages.splice(imageToDelete, 1)
      setSkillImages(updatedImages)
      setImageDeleteDialogOpen(false)
      setImageToDelete(null)
    }
  }

  return (
    <section id="skills" className="shadow-sm dark:shadow-gray-900 dark:shadow-sm py-16 md:py-20 lg:py-24 bg-gray-100">
      <div className="max-w-6xl mx-auto px-4">
        {/* Title Row - Now at the top */}
        <div className="mb-12">
          <AnimatedSection delay={0.1}>
            <h2 className="text-red-600 font-bold tracking-tighter leading-none mb-6 overflow-hidden">
              <EditableText initialText="MY SKILLS" as="span" initialFontSize={72} className="text-red-600" />
            </h2>
            <div className="flex mt-4">
              <div className="w-2 h-2 rounded-full bg-red-600 mr-2"></div>
              <div className="w-2 h-2 rounded-full bg-red-600 mr-2"></div>
              <div className="w-2 h-2 rounded-full bg-red-600"></div>
            </div>
          </AnimatedSection>
        </div>

        {/* Content Row - Now below the title */}
        <div className="space-y-8">
          {/* Skills List */}
          <AnimatedSection delay={0.3} variant="fadeInLeft">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={skills.map((skill) => skill.id)} strategy={verticalListSortingStrategy}>
                  <AnimatePresence>
                    {skills.map((skill, index) => (
                      <SortableSkillItem
                        key={skill.id}
                        skill={skill}
                        confirmDelete={confirmDelete}
                        index={index}
                        isAdmin={isAdmin}
                      />
                    ))}
                  </AnimatePresence>
                </SortableContext>
              </DndContext>

              {/* Add New Skill Button - Only visible to admin */}
              {isAdmin && (
                <motion.div
                  className="mt-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      onClick={addNewSkill}
                      variant="secondary"
                      className="border-red-600 text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <PlusCircle size={16} />
                      Add Skill
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </AnimatedSection>

          {/* Skill Images */}
          <AnimatedSection delay={0.5} variant="fadeInLeft">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Skill Images</h3>
                {isAdmin && (
                  <div className="flex gap-2">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="border-red-600 text-red-600 hover:bg-red-50 flex items-center gap-2"
                        onClick={() => setImageDialogOpen(true)}
                      >
                        <ImagePlus size={16} />
                        Add Image
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="border-red-600 text-red-600 hover:bg-red-50 flex items-center gap-2"
                        onClick={() => addSkillImage()}
                      >
                        <PlusCircle size={16} />
                        Add Random Image
                      </Button>
                    </motion.div>
                  </div>
                )}
              </div>

              {isAdmin && imageDialogOpen && (
                <div className="mb-6">
                  <ImageUploadArea onImageSelected={(file) => addSkillImage(file)} />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                  {skillImages.map((image, index) => (
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
                        src={image || "/placeholder.svg"}
                        alt={`Skill image ${index + 1}`}
                        width={400}
                        height={300}
                        className="w-full h-auto object-cover rounded-md shadow-md"
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
                            onClick={() => confirmDeleteImage(index)}
                          >
                            <X size={14} />
                            <span className="sr-only">Remove image</span>
                          </Button>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {skillImages.length === 0 && (
                  <div className="col-span-2 text-center py-8 border border-dashed rounded-md text-gray-400">
                    No skill images available
                  </div>
                )}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* Delete Skill Confirmation Dialog */}
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
                    Are you sure you want to delete this skill? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-start mt-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="destructive" onClick={deleteSkill}>
                      Delete
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="default" onClick={() => setDeleteDialogOpen(false)}>
                      Cancel
                    </Button>
                  </motion.div>
                </DialogFooter>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Delete Image Confirmation Dialog */}
      <AnimatePresence>
        {imageDeleteDialogOpen && (
          <Dialog open={imageDeleteDialogOpen} onOpenChange={setImageDeleteDialogOpen}>
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
                    Are you sure you want to delete this image? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-start mt-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="destructive" onClick={deleteSkillImage}>
                      Delete
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="default" onClick={() => setImageDeleteDialogOpen(false)}>
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
