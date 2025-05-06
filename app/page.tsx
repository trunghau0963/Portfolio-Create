"use client";

import { useState, useEffect } from "react";
import Hero from "@/components/sections/hero";
import Introduction from "@/components/sections/introduction";
import Education from "@/components/sections/education";
import Skills from "@/components/sections/skills";
import Experience from "@/components/sections/experience";
import Projects from "@/components/sections/projects";
import Testimonials from "@/components/sections/testimonials";
import Contact from "@/components/sections/contact";
import CustomSection from "@/components/sections/custom-section";
import Footer from "@/components/footer";
import Header from "@/components/header";
import SectionManager, { type Section } from "@/components/ui/section-manager";
import ScrollProgress from "@/components/ui/scroll-progress";
import ScrollToTop from "@/components/ui/scroll-to-top";
import { useAuth } from "@/context/auth-context";
import AdminIndicator from "@/components/admin-indicator";
import { motion } from "framer-motion";
import SectionTransition from "@/components/ui/section-transition";
import IntroductionSection from "@/components/sections/introduction";

export default function Home() {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;

  // State for sections
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  // Load sections from localStorage on component mount
  useEffect(() => {
    const loadSections = () => {
      const savedSections = localStorage.getItem("portfolioSections");
      if (savedSections) {
        setSections(JSON.parse(savedSections));
      } else {
        // Default sections if none exist
        const defaultSections: Section[] = [
          { id: 1, type: "hero", title: "Hero", visible: true, position: 1 },
          {
            id: 2,
            type: "introduction",
            title: "Introduction",
            visible: true,
            position: 2,
          },
          {
            id: 3,
            type: "education",
            title: "Education",
            visible: true,
            position: 3,
          },
          {
            id: 4,
            type: "skills",
            title: "Skills",
            visible: true,
            position: 4,
          },
          {
            id: 5,
            type: "experience",
            title: "Experience",
            visible: true,
            position: 5,
          },
          {
            id: 6,
            type: "projects",
            title: "Projects",
            visible: true,
            position: 6,
          },
          {
            id: 7,
            type: "testimonials",
            title: "Testimonials",
            visible: true,
            position: 7,
          },
          {
            id: 8,
            type: "contact",
            title: "Contact",
            visible: true,
            position: 8,
          },
        ];
        setSections(defaultSections);
        localStorage.setItem(
          "portfolioSections",
          JSON.stringify(defaultSections)
        );
      }
      setLoading(false);
    };

    loadSections();
  }, []);

  // Listen for changes to sections in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const savedSections = localStorage.getItem("portfolioSections");
      if (savedSections) {
        setSections(JSON.parse(savedSections));
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Custom event listener for local changes
    const handleLocalChange = () => {
      const savedSections = localStorage.getItem("portfolioSections");
      if (savedSections) {
        setSections(JSON.parse(savedSections));
      }
    };

    window.addEventListener("sectionsUpdated", handleLocalChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("sectionsUpdated", handleLocalChange);
    };
  }, []);

  // Render section based on type
  const renderSection = (section: Section) => {
    if (!section.visible) return null;

    switch (section.type) {
      case "hero":
        return <Hero key={section.id} />;
      case "introduction":
        return (
          <>
            <SectionTransition id="introduction-transition"  color="black" />
            <Introduction key={section.id} />
          </>
        );
      case "education":
        return (
          <>
            <SectionTransition id="education-transition" color="black" />
            <Education key={section.id} />
          </>
        );
      case "skills":
        return (
          <>
            <SectionTransition id="skills-transition" color="black" />
            <Skills key={section.id} />
          </>
        );
      case "experience":
        return (
          <>
            <SectionTransition id="experience-transition" color="black" />
            <Experience key={section.id} />
          </>
        );
      case "projects":
        return (
          <>
            <SectionTransition id="projects-transition" color="black" />
            <Projects key={section.id} />
          </>
        );
      case "testimonials":
        return (
          <>
            <SectionTransition id="testimonials-transition" color="black" />
            <Testimonials key={section.id} />
          </>
        );
      case "contact":
        return (
          <>
            <SectionTransition id="contact-transition" color="black" />
            <Contact key={section.id} />
          </>
        );
      case "custom":
        return (
          <>
            <SectionTransition id="custom-transition" color="black" />
            <CustomSection
              key={section.id}
              id={section.id}
              title={section.title}
              bgColor={section.bgColor}
            />
          </>
        );
      default:
        return null;
    }
  };

  // Get visible sections for navigation
  const visibleSections = sections
    .filter((section) => section.visible)
    .sort((a, b) => a.position - b.position);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-200 dark:bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <ScrollProgress />
      <Header sections={visibleSections} />

      {visibleSections.map(renderSection)}

      <Footer />
      <ScrollToTop />
      <AdminIndicator />
      {isAdmin && <SectionManager />}
    </motion.div>
  );
}
