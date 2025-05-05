"use client"

import { motion } from "framer-motion"
import { Star, StarHalf, Edit, Trash2, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import type { Testimonial } from "../sections/testimonials"

interface TestimonialCardProps {
  testimonial: Testimonial
  onEdit?: () => void
  onDelete?: () => void
}

export default function TestimonialCard({ testimonial, onEdit, onDelete }: TestimonialCardProps) {
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
    <div className="bg-gray-50 rounded-lg p-6 md:p-8 shadow-sm relative group opacity-90">
      {/* Admin Controls */}
      {(onEdit || onDelete) && (
        <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                className="h-8 w-8 rounded-full bg-white shadow-sm text-gray-500 hover:text-red-600"
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">Edit testimonial</span>
              </Button>
            </motion.div>
          )}
          {onDelete && (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="h-8 w-8 rounded-full bg-white shadow-sm text-gray-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete testimonial</span>
              </Button>
            </motion.div>
          )}
        </div>
      )}

      {/* Quote Icon */}
      <div className="absolute -top-6 left-8">
        <div className="bg-red-600 rounded-full p-3 shadow-md">
          <Quote className="h-6 w-6 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 pt-6">
        {/* Content */}
        <div className="md:col-span-8 order-2 md:order-1">
          <div className="space-y-4">
            <p className="text-gray-700 italic">{testimonial.content}</p>

            <div className="flex items-center">
              <div className="flex">{renderRating(testimonial.rating)}</div>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="md:col-span-4 order-1 md:order-2 flex flex-col items-center md:items-end">
          <div className="flex flex-col items-center md:items-end space-y-3">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-md">
              <Image
                src={testimonial.imageSrc || "/placeholder.svg"}
                alt={testimonial.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="text-center md:text-right">
              <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
              <p className="text-sm text-gray-600">
                {testimonial.role}, {testimonial.company}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
