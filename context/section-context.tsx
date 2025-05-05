"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-context"

// Define section types
export type SectionType = "hero" | "introduction" | "education" | "skills" | "experience" | "projects" | "custom"

// Define section interface
export interface Section {
  id: number
  type: SectionType
  title: string
  visible: boolean
  position: number
  customContent?: any // For custom sections
  bgColor?: string
}

interface SectionContextType {
  sections: Section[]
  isLoading: boolean
  error: string | null
  toggleSectionVisibility: (id: number) => Promise<void>
  reorderSection: (id: number, newPosition: number) => Promise<void>
  addSection: (sectionType: SectionType, title: string) => Promise<void>
  deleteSection: (id: number) => Promise<void>
  updateSectionTitle: (id: number, title: string) => Promise<void>
  updateSectionBgColor: (id: number, bgColor: string) => Promise<void>
}

const SectionContext = createContext<SectionContextType | undefined>(undefined)

export const SectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sections, setSections] = useState<Section[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const isAdmin = user?.isAdmin

  // Initialize with default sections if none exist
  const defaultSections: Omit<Section, "id">[] = [
    { type: "hero", title: "PORTFOLIO", visible: true, position: 1 },
    { type: "introduction", title: "INTRODUCTION", visible: true, position: 2 },
    { type: "education", title: "EDUCATION", visible: true, position: 3 },
    { type: "skills", title: "MY SKILLS", visible: true, position: 4 },
    { type: "experience", title: "EXPERIENCE", visible: true, position: 5 },
    { type: "projects", title: "PROJECTS", visible: true, position: 6 },
  ]

  // Load sections from localStorage or initialize with defaults
  useEffect(() => {
    const loadSections = async () => {
      try {
        // First try to load from localStorage
        const storedSections = localStorage.getItem("portfolio-sections")

        if (storedSections) {
          setSections(JSON.parse(storedSections))
        } else {
          // If no stored sections, initialize with defaults
          setSections(defaultSections.map((section, index) => ({ ...section, id: index + 1 })))
        }
      } catch (err) {
        setError("Failed to load sections")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadSections()
  }, [])

  // Save sections to localStorage whenever they change
  useEffect(() => {
    if (sections.length > 0) {
      localStorage.setItem("portfolio-sections", JSON.stringify(sections))
    }
  }, [sections])

  // Toggle section visibility
  const toggleSectionVisibility = async (id: number) => {
    if (!isAdmin) return

    try {
      setSections((prevSections) =>
        prevSections.map((section) => (section.id === id ? { ...section, visible: !section.visible } : section)),
      )
    } catch (err) {
      setError("Failed to toggle section visibility")
      console.error(err)
    }
  }

  // Reorder section
  const reorderSection = async (id: number, newPosition: number) => {
    if (!isAdmin) return

    try {
      // Find the section to move
      const sectionToMove = sections.find((s) => s.id === id)
      if (!sectionToMove) return

      const oldPosition = sectionToMove.position

      // Update all affected sections
      setSections((prevSections) => {
        const updatedSections = prevSections.map((section) => {
          if (section.id === id) {
            return { ...section, position: newPosition }
          } else if (oldPosition < newPosition && section.position > oldPosition && section.position <= newPosition) {
            // Move sections up (decrease position)
            return { ...section, position: section.position - 1 }
          } else if (oldPosition > newPosition && section.position < oldPosition && section.position >= newPosition) {
            // Move sections down (increase position)
            return { ...section, position: section.position + 1 }
          }
          return section
        })

        // Sort by position
        return updatedSections.sort((a, b) => a.position - b.position)
      })
    } catch (err) {
      setError("Failed to reorder section")
      console.error(err)
    }
  }

  // Add new section
  const addSection = async (sectionType: SectionType, title: string) => {
    if (!isAdmin) return

    try {
      const newPosition = sections.length + 1
      const newId = Math.max(...sections.map((s) => s.id), 0) + 1

      const newSection: Section = {
        id: newId,
        type: sectionType,
        title: title,
        visible: true,
        position: newPosition,
        bgColor: sectionType === "custom" ? "#f3f4f6" : undefined, // Default bg color for custom sections
      }

      setSections((prevSections) => [...prevSections, newSection].sort((a, b) => a.position - b.position))
    } catch (err) {
      setError("Failed to add section")
      console.error(err)
    }
  }

  // Delete section
  const deleteSection = async (id: number) => {
    if (!isAdmin) return

    try {
      const sectionToDelete = sections.find((s) => s.id === id)
      if (!sectionToDelete) return

      const positionToDelete = sectionToDelete.position

      setSections((prevSections) => {
        // Remove the section
        const filteredSections = prevSections.filter((section) => section.id !== id)

        // Update positions of remaining sections
        return filteredSections
          .map((section) => {
            if (section.position > positionToDelete) {
              return { ...section, position: section.position - 1 }
            }
            return section
          })
          .sort((a, b) => a.position - b.position)
      })
    } catch (err) {
      setError("Failed to delete section")
      console.error(err)
    }
  }

  // Update section title
  const updateSectionTitle = async (id: number, title: string) => {
    if (!isAdmin) return

    try {
      setSections((prevSections) =>
        prevSections.map((section) => (section.id === id ? { ...section, title } : section)),
      )
    } catch (err) {
      setError("Failed to update section title")
      console.error(err)
    }
  }

  // Update section background color
  const updateSectionBgColor = async (id: number, bgColor: string) => {
    if (!isAdmin) return

    try {
      setSections((prevSections) =>
        prevSections.map((section) => (section.id === id ? { ...section, bgColor } : section)),
      )
    } catch (err) {
      setError("Failed to update section background color")
      console.error(err)
    }
  }

  return (
    <SectionContext.Provider
      value={{
        sections,
        isLoading,
        error,
        toggleSectionVisibility,
        reorderSection,
        addSection,
        deleteSection,
        updateSectionTitle,
        updateSectionBgColor,
      }}
    >
      {children}
    </SectionContext.Provider>
  )
}

export const useSections = () => {
  const context = useContext(SectionContext)
  if (context === undefined) {
    throw new Error("useSections must be used within a SectionProvider")
  }
  return context
}
