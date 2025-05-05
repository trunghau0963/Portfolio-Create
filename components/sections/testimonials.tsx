"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Star, StarHalf, Plus, AlertCircle, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import AnimatedSection from "../ui/animated-section"
import { useAuth } from "@/context/auth-context"
import TestimonialCard from "../ui/testimonial-card"
import EditableText from "../ui/editable-text"
import EditableTextAutoResize from "../ui/editable-text-auto-resize"

// Define testimonial type
export interface Testimonial {
  id: number
  name: string
  role: string
  company: string
  content: string
  rating: number
  imageSrc: string
}

export default function TestimonialsSection() {
  const { user } = useAuth()
  const isAdmin = user?.isAdmin
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [testimonialToDelete, setTestimonialToDelete] = useState<number | null>(null)
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formName, setFormName] = useState("")
  const [formRole, setFormRole] = useState("")
  const [formCompany, setFormCompany] = useState("")
  const [formContent, setFormContent] = useState("")
  const [formRating, setFormRating] = useState(5)
  const [formImage, setFormImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Sample testimonials
  const [testimonials, setTestimonials] = useState<Testimonial[]>([
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Marketing Director",
      company: "Innovate Inc.",
      content:
        "Working with this team was an absolute pleasure. They understood our vision from day one and delivered a website that exceeded our expectations. The design is not only beautiful but also highly functional.",
      rating: 5,
      imageSrc: "https://picsum.photos/200/200?random=1",
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "CEO",
      company: "TechStart Solutions",
      content:
        "I've worked with many designers over the years, but none have captured our brand essence as well as this team. Their attention to detail and creative approach transformed our online presence.",
      rating: 4.5,
      imageSrc: "https://picsum.photos/200/200?random=2",
    },
    {
      id: 3,
      name: "Elena Rodriguez",
      role: "Product Manager",
      company: "Global Innovations",
      content:
        "The portfolio redesign completely transformed our brand perception. We've seen a 40% increase in engagement and countless compliments from our clients. I couldn't recommend them more highly.",
      rating: 5,
      imageSrc: "https://picsum.photos/200/200?random=3",
    },
  ])

  // Navigate to previous testimonial
  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1))
  }

  // Navigate to next testimonial
  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1))
  }

  // Open dialog to add new testimonial
  const openAddDialog = () => {
    setEditingTestimonial(null)
    setFormName("")
    setFormRole("")
    setFormCompany("")
    setFormContent("")
    setFormRating(5)
    setFormImage(null)
    setPreviewUrl(null)
    setDialogOpen(true)
  }

  // Open dialog to edit testimonial
  const openEditDialog = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial)
    setFormName(testimonial.name)
    setFormRole(testimonial.role)
    setFormCompany(testimonial.company)
    setFormContent(testimonial.content)
    setFormRating(testimonial.rating)
    setFormImage(null)
    setPreviewUrl(testimonial.imageSrc)
    setDialogOpen(true)
  }

  // Confirm delete testimonial
  const confirmDelete = (id: number) => {
    setTestimonialToDelete(id)
    setDeleteDialogOpen(true)
  }

  // Delete testimonial
  const deleteTestimonial = () => {
    if (testimonialToDelete !== null) {
      const newTestimonials = testimonials.filter((t) => t.id !== testimonialToDelete)
      setTestimonials(newTestimonials)

      // Adjust current index if needed
      if (currentIndex >= newTestimonials.length) {
        setCurrentIndex(Math.max(0, newTestimonials.length - 1))
      }

      setDeleteDialogOpen(false)
      setTestimonialToDelete(null)
    }
  }

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFormImage(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Use random image from Picsum Photos
  const useRandomImage = () => {
    const randomId = Math.floor(Math.random() * 1000)
    const imageUrl = `https://picsum.photos/200/200?random=${randomId}`

    // Fetch the image and convert to File object
    fetch(imageUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const file = new File([blob], "testimonial-image.jpg", { type: "image/jpeg" })
        setFormImage(file)
        setPreviewUrl(imageUrl)
      })
      .catch((error) => {
        console.error("Error fetching random image:", error)
      })
  }

  // Save testimonial (add or edit)
  const saveTestimonial = () => {
    if (!formName || !formRole || !formCompany || !formContent) return

    const imageSrc = previewUrl || `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 1000)}`

    if (editingTestimonial) {
      // Update existing testimonial
      setTestimonials(
        testimonials.map((t) =>
          t.id === editingTestimonial.id
            ? {
                ...t,
                name: formName,
                role: formRole,
                company: formCompany,
                content: formContent,
                rating: formRating,
                imageSrc: imageSrc,
              }
            : t,
        ),
      )
    } else {
      // Add new testimonial
      const newId = testimonials.length > 0 ? Math.max(...testimonials.map((t) => t.id)) + 1 : 1
      const newTestimonial: Testimonial = {
        id: newId,
        name: formName,
        role: formRole,
        company: formCompany,
        content: formContent,
        rating: formRating,
        imageSrc: imageSrc,
      }
      setTestimonials([...testimonials, newTestimonial])

      // Set current index to show the new testimonial
      setCurrentIndex(testimonials.length)
    }

    setDialogOpen(false)
  }

  // Render star rating
  const renderRating = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="h-4 w-4 fill-current text-yellow-400" />)
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="h-4 w-4 fill-current text-yellow-400" />)
    }

    return stars
  }

  return (
    <section id="testimonials" className="shadow-sm dark:shadow-gray-900 dark:shadow-sm py-16 md:py-20 lg:py-24 bg-gray-100">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Title Column */}
          <div className="lg:col-span-4">
            <AnimatedSection delay={0.1}>
            <EditableTextAutoResize
              initialText="TESTIMONIALS"
              as="h1"
              className="text-red-600 text-5xl sm:text-[80px] md:text-[100px] lg:text-[135px] font-bold leading-none tracking-tighter"
            />
              <div className="flex mt-4">
                <div className="w-2 h-2 rounded-full bg-red-600 mr-2"></div>
                <div className="w-2 h-2 rounded-full bg-red-600 mr-2"></div>
                <div className="w-2 h-2 rounded-full bg-red-600"></div>
              </div>
              <div className="mt-6">
                <EditableText
                  initialText="What clients say about my work. These testimonials reflect the quality and dedication I bring to every project."
                  className="text-sm"
                />
              </div>
            </AnimatedSection>
          </div>

          {/* Content Column */}
          <div className="lg:col-span-8">
            <div className="relative">
              {/* Testimonial Cards */}
              <div className="relative min-h-[400px]">
                <AnimatePresence mode="wait">
                  {testimonials.length > 0 ? (
                    <motion.div
                      key={`testimonial-${currentIndex}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.5 }}
                      className="absolute w-full"
                    >
                      <TestimonialCard
                        testimonial={testimonials[currentIndex]}
                        onEdit={isAdmin ? () => openEditDialog(testimonials[currentIndex]) : undefined}
                        onDelete={isAdmin ? () => confirmDelete(testimonials[currentIndex].id) : undefined}
                      />
                    </motion.div>
                  ) : (
                    <div className="flex items-center justify-center h-[400px] bg-gray-50 rounded-lg">
                      <p className="text-gray-500">No testimonials yet</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* Navigation Controls */}
              {testimonials.length > 1 && (
                <div className="flex justify-between mt-8">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={prevTestimonial}
                      className="rounded-full border-red-600 text-red-600 hover:bg-red-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                      <span className="sr-only">Previous testimonial</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={nextTestimonial}
                      className="rounded-full border-red-600 text-red-600 hover:bg-red-50"
                    >
                      <ChevronRight className="h-5 w-5" />
                      <span className="sr-only">Next testimonial</span>
                    </Button>
                  </div>

                  <div className="flex items-center gap-1">
                    {testimonials.map((_, index) => (
                      <button
                        key={`dot-${index}`}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentIndex ? "bg-red-600" : "bg-gray-300 hover:bg-red-300"
                        }`}
                        onClick={() => setCurrentIndex(index)}
                        aria-label={`Go to testimonial ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Add Testimonial Button (Admin only) */}
              {isAdmin && (
                <motion.div
                  className="mt-8 flex justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={openAddDialog}
                      variant="outline"
                      className="border-red-600 text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add Testimonial
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Testimonial Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingTestimonial ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle>
            <DialogDescription>
              {editingTestimonial
                ? "Update the testimonial information below."
                : "Add a new client testimonial to showcase on your portfolio."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Client Name</Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role/Position</Label>
                <Input id="role" value={formRole} onChange={(e) => setFormRole(e.target.value)} placeholder="CEO" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formCompany}
                onChange={(e) => setFormCompany(e.target.value)}
                placeholder="Acme Inc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Testimonial</Label>
              <Textarea
                id="content"
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="What the client said about your work..."
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={`rating-${rating}`}
                    type="button"
                    onClick={() => setFormRating(rating)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        rating <= formRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-500">{formRating} out of 5</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Client Photo</Label>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {previewUrl ? (
                    <img
                      src={previewUrl || "/placeholder.svg"}
                      alt="Preview"
                      className="w-20 h-20 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                      <Quote className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                      Choose File
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={useRandomImage}>
                      Use Random Image
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Upload a professional photo of your client or use a random placeholder.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveTestimonial} disabled={!formName || !formRole || !formCompany || !formContent}>
              {editingTestimonial ? "Save Changes" : "Add Testimonial"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this testimonial? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-start mt-4">
            <Button variant="destructive" onClick={deleteTestimonial}>
              Delete
            </Button>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
