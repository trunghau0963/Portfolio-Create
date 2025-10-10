"use client"

import { useState, useEffect, useRef } from "react"

interface UseScrollAnimationOptions {
  threshold?: number
  triggerOnce?: boolean
  rootMargin?: string
}

export function useScrollAnimation({
  threshold = 0.1,
  triggerOnce = true,
  rootMargin = "0px",
}: UseScrollAnimationOptions = {}) {
  const [isInView, setIsInView] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const currentRef = ref.current
    if (!currentRef) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            if (triggerOnce) {
              setHasAnimated(true)
              observer.unobserve(currentRef)
            }
          } else {
            if (!triggerOnce && hasAnimated) {
              setIsInView(false)
            }
          }
        })
      },
      {
        threshold,
        rootMargin,
      },
    )

    observer.observe(currentRef)

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [threshold, triggerOnce, rootMargin, hasAnimated])

  return { ref, isInView, hasAnimated }
}
    