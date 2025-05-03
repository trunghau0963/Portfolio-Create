"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"

interface AutoAdjustContainerProps {
  children: ReactNode
  className?: string
  minHeight?: number
}

export default function AutoAdjustContainer({ children, className = "", minHeight = 100 }: AutoAdjustContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number>(minHeight)

  // Update height when children change
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Get the height of all children
        let totalHeight = 0
        if (containerRef.current) {
          Array.from(containerRef.current.children).forEach((child) => {
            totalHeight += child.scrollHeight
          })
        }

        // Set height to max of minHeight or content height
        setHeight(Math.max(minHeight, totalHeight))
      }
    })

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [minHeight])

  return (
    <div ref={containerRef} className={className} style={{ minHeight: `${height}px` }}>
      {children}
    </div>
  )
}
