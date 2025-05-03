"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"

type AnimationVariant =
  | "fadeIn"
  | "fadeInUp"
  | "fadeInDown"
  | "fadeInLeft"
  | "fadeInRight"
  | "zoomIn"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "bounce"
  | "rotate"
  | "flip"
  | "none"

interface AnimatedSectionProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  variant?: AnimationVariant
  threshold?: number
  triggerOnce?: boolean
  rootMargin?: string
}

export default function AnimatedSection({
  children,
  className = "",
  delay = 0,
  duration = 0.6,
  variant = "fadeInUp",
  threshold = 0.1,
  triggerOnce = true,
  rootMargin = "-50px",
}: AnimatedSectionProps) {
  const { ref, isInView } = useScrollAnimation({
    threshold,
    triggerOnce,
    rootMargin,
  })

  const getVariants = () => {
    switch (variant) {
      case "fadeIn":
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        }
      case "fadeInUp":
        return {
          hidden: { opacity: 0, y: 50 },
          visible: { opacity: 1, y: 0 },
        }
      case "fadeInDown":
        return {
          hidden: { opacity: 0, y: -50 },
          visible: { opacity: 1, y: 0 },
        }
      case "fadeInLeft":
        return {
          hidden: { opacity: 0, x: -50 },
          visible: { opacity: 1, x: 0 },
        }
      case "fadeInRight":
        return {
          hidden: { opacity: 0, x: 50 },
          visible: { opacity: 1, x: 0 },
        }
      case "zoomIn":
        return {
          hidden: { opacity: 0, scale: 0.8 },
          visible: { opacity: 1, scale: 1 },
        }
      case "slideUp":
        return {
          hidden: { y: 100 },
          visible: { y: 0 },
        }
      case "slideDown":
        return {
          hidden: { y: -100 },
          visible: { y: 0 },
        }
      case "slideLeft":
        return {
          hidden: { x: -100 },
          visible: { x: 0 },
        }
      case "slideRight":
        return {
          hidden: { x: 100 },
          visible: { x: 0 },
        }
      case "bounce":
        return {
          hidden: { y: 0 },
          visible: {
            y: [0, -20, 0],
            transition: {
              repeat: 0,
              duration: 0.5,
            },
          },
        }
      case "rotate":
        return {
          hidden: { rotate: -10, opacity: 0 },
          visible: { rotate: 0, opacity: 1 },
        }
      case "flip":
        return {
          hidden: { rotateX: 90, opacity: 0 },
          visible: { rotateX: 0, opacity: 1 },
        }
      case "none":
        return {
          hidden: {},
          visible: {},
        }
      default:
        return {
          hidden: { opacity: 0, y: 50 },
          visible: { opacity: 1, y: 0 },
        }
    }
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={getVariants()}
      transition={{
        duration,
        delay,
        ease: "easeOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
  