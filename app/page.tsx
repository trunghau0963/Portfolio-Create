"use client"

import { useEffect } from "react"
import Header from "@/components/header"
import Footer from "@/components/footer"
import HeroSection from "@/components/sections/hero"
import IntroductionSection from "@/components/sections/introduction"
import EducationSection from "@/components/sections/education"
import SkillsSection from "@/components/sections/skill"
import ExperienceSection from "@/components/sections/experience"
import ProjectsSection from "@/components/sections/project"
import ContactSection from "@/components/sections/contact"
import { motion, AnimatePresence } from "framer-motion"

export default function PortfolioPage() {
  // Smooth scroll for anchor links
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest('a[href^="#"]')

      if (anchor) {
        e.preventDefault()
        const targetId = anchor.getAttribute("href")
        if (targetId && targetId !== "#") {
          const targetElement = document.querySelector(targetId)
          if (targetElement) {
            window.scrollTo({
              top: targetElement.getBoundingClientRect().top + window.scrollY - 80, // Offset for header
              behavior: "smooth",
            })
          }
        }
      }
    }

    document.addEventListener("click", handleAnchorClick)
    return () => document.removeEventListener("click", handleAnchorClick)
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        className="bg-gray-100 min-h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Header />
        <main className="flex-1 pt-16">
          <HeroSection />

          {/* Section Divider */}
          <div className="w-full h-px bg-black/20 max-w-6xl mx-auto my-4"></div>

          <IntroductionSection />

          {/* Section Divider */}
          <div className="w-full h-px bg-black/20 max-w-6xl mx-auto my-4"></div>

          <EducationSection />

          {/* Section Divider */}
          <div className="w-full h-px bg-black/20 max-w-6xl mx-auto my-4"></div>

          <SkillsSection />

          {/* Section Divider */}
          <div className="w-full h-px bg-black/20 max-w-6xl mx-auto my-4"></div>

          <ExperienceSection />

          {/* Section Divider */}
          <div className="w-full h-px bg-black/20 max-w-6xl mx-auto my-4"></div>

          <ProjectsSection />

          {/* Section Divider */}
          <div className="w-full h-px bg-black/20 max-w-6xl mx-auto my-4"></div>

          <ContactSection />
        </main>
        <Footer />
      </motion.div>
    </AnimatePresence>
  )
}
