"use client"

import { useState } from "react"
import EditableText from "../ui/editable-text"
import { Button } from "@/components/ui/button"
import { PlusCircle, Trash2, AlertCircle, GripVertical, ImagePlus, X } from "lucide-react"
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

// Define a skill type
interface Skill {
  id: number
  title: string
  description: string
}

// Sortable Skill Item Component
function SortableSkillItem({
  skill,
  confirmDelete,
  index,
}: {
  skill: Skill
  confirmDelete: (id: number) => void
  index: number
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
      className="flex items-start mb-6"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <div className="mr-2 cursor-grab active:cursor-grabbing mt-1 touch-manipulation" {...attributes} {...listeners}>
        <GripVertical className="h-5 w-5 text-gray-400 hover:text-gray-600" />
      </div>
      <motion.div
        className="w-3 h-3 rounded-full bg-red-600 mt-1 mr-3 flex-shrink-0"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
      ></motion.div>
      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <EditableText initialText={skill.title} as="h3" className="font-bold uppercase mb-2 text-sm sm:text-base" />
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
        </div>
        <EditableText initialText={skill.description} className="text-sm" />
      </div>
    </motion.div>
  )
}

export default function SkillsSection() {
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
  const addSkillImage = () => {
    // In a real implementation, you would handle file upload here
    // For now, we'll just add a random picsum image
    const randomId = Math.floor(Math.random() * 1000)
    const newImageUrl = `https://picsum.photos/400/300?random=${randomId}`
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
    <section id="skills" className="py-16 md:py-20 lg:py-24">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Title Column */}
          <div className="lg:col-span-4">
            <AnimatedSection delay={0.1}>
              <h2 className="text-red-600 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-none mb-6">
                MY SKILLS
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
              {/* Skills List */}
              <AnimatedSection delay={0.3} direction="left">
                <div className="bg-gray-50 rounded-lg shadow-sm p-6">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={skills.map((skill) => skill.id)} strategy={verticalListSortingStrategy}>
                      <AnimatePresence>
                        {skills.map((skill, index) => (
                          <SortableSkillItem key={skill.id} skill={skill} confirmDelete={confirmDelete} index={index} />
                        ))}
                      </AnimatePresence>
                    </SortableContext>
                  </DndContext>

                  {/* Add New Skill Button */}
                  <motion.div
                    className="mt-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                  >
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button
                        onClick={addNewSkill}
                        variant="outline"
                        className="border-red-600 text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <PlusCircle size={16} />
                        Add Skill
                      </Button>
                    </motion.div>
                  </motion.div>
                </div>
              </AnimatedSection>

              {/* Skill Images */}
              <AnimatedSection delay={0.5} direction="left">
                <div className="bg-gray-50 rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Skill Images</h3>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-600 hover:bg-red-50 flex items-center gap-2"
                        onClick={() => setImageDialogOpen(true)}
                      >
                        <ImagePlus size={16} />
                        Add Image
                      </Button>
                    </motion.div>
                  </div>

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

      {/* Add Image Dialog */}
      <AnimatePresence>
        {imageDialogOpen && (
          <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
            <DialogContent>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
              >
                <DialogHeader>
                  <DialogTitle>Add Skill Image</DialogTitle>
                  <DialogDescription>Add a new image to showcase your skills.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                    <ImagePlus className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Click to select an image or drag and drop</p>
                    <p className="text-xs text-gray-400 mt-2">
                      (For this demo, we'll use a random image from Picsum Photos)
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
                      Cancel
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button onClick={addSkillImage}>Add Image</Button>
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
                    <Button variant="outline" onClick={() => setImageDeleteDialogOpen(false)}>
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
