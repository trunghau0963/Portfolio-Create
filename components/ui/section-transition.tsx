"use client"

import { motion } from "framer-motion"
import { useScrollAnimation } from "@/hooks/use-scroll-animation"

interface SectionTransitionProps {
  id?: string
  className?: string
  color?: "red" | "white" | "black"
}

export default function SectionTransition({ id, className = "", color = "red" }: SectionTransitionProps) {
  const { ref, isInView } = useScrollAnimation({
    threshold: 0.5,
    triggerOnce: false,
    rootMargin: "-100px",
  })

  const getColor = () => {
    switch (color) {
      case "red":
        return "bg-red-600"
      case "white":
        return "bg-white"
      case "black":
        return "bg-black/20"
      default:
        return "bg-red-600"
    }
  }

  return (
    <div id={id} className={`w-full max-w-6xl mx-auto my-8 ${className}`} ref={ref}>
      <div className="flex items-center justify-center gap-2">
        <motion.div
          className={`h-px ${getColor()} flex-grow max-w-[100px] md:max-w-[200px]`}
          initial={{ width: 0 }}
          animate={{ width: isInView ? "100%" : 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
        <div className="flex gap-2">
          <motion.div
            className={`w-2 h-2 rounded-full ${getColor()}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: isInView ? 1 : 0, opacity: isInView ? 1 : 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          />
          <motion.div
            className={`w-2 h-2 rounded-full ${getColor()}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: isInView ? 1 : 0, opacity: isInView ? 1 : 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          />
          <motion.div
            className={`w-2 h-2 rounded-full ${getColor()}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: isInView ? 1 : 0, opacity: isInView ? 1 : 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          />
        </div>
        <motion.div
          className={`h-px ${getColor()} flex-grow max-w-[100px] md:max-w-[200px]`}
          initial={{ width: 0 }}
          animate={{ width: isInView ? "100%" : 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      </div>
    </div>
  )
}
