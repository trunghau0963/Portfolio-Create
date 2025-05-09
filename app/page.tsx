"use client";

import { useState, useEffect } from "react";
import Hero from "@/components/sections/hero";
import IntroductionComponent from "@/components/sections/introduction";
import Education from "@/components/sections/education";
import Skills from "@/components/sections/skills";
import Experience from "@/components/sections/experience";
import Projects from "@/components/sections/projects";
import Testimonials from "@/components/sections/testimonials";
import Contact from "@/components/sections/contact";
import CustomSection from "@/components/sections/custom-section";
import Footer from "@/components/footer";
import Header from "@/components/header";
import SectionManager from "@/components/ui/section-manager";
import ScrollProgress from "@/components/ui/scroll-progress";
import ScrollToTop from "@/components/ui/scroll-to-top";
import { useSections, type AppSection as Section } from "@/context/section-context";
import { useAuth } from "@/context/auth-context";
import AdminIndicator from "@/components/admin-indicator";
import { motion } from "framer-motion";
import SectionTransition from "@/components/ui/section-transition";
import { type Category as PrismaCategory } from "@/lib/generated/prisma";

export default function Home() {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;

  const { sections, isLoading, error, refetchSections } = useSections();
  const [allCategoriesFromDB, setAllCategoriesFromDB] = useState<PrismaCategory[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesResponse = await fetch("/api/categories");
        if (!categoriesResponse.ok) {
          throw new Error(`HTTP error! status: ${categoriesResponse.status} for categories`);
        }
        const categoriesData = await categoriesResponse.json();
        setAllCategoriesFromDB(categoriesData);
      } catch (e) {
        console.error("Failed to fetch categories:", e);
      }
    };
    fetchCategories();
  }, []);

  const renderSection = (section: Section) => {
    const handleDataChange = () => {
      refetchSections();
    };

    if (!section.visible) return null;

    switch (section.type) {
      case "hero":
        return <Hero key={section.id} section={section} />;
      case "introduction":
        return (
          <>
            <SectionTransition id="introduction-transition" color="black" />
            <IntroductionComponent
              key={section.id}
              section={section}
              onDataChange={handleDataChange}
            />
          </>
        );
      case "education":
        return (
          <>
            <SectionTransition id="education-transition" color="black" />
            <Education
              key={section.id}
              section={section}
              onDataChange={handleDataChange}
            />
          </>
        );
      case "skills":
        return (
          <>
            <SectionTransition id="skills-transition" color="black" />
            <Skills
              key={section.id}
              section={section}
              onDataChange={handleDataChange}
            />
          </>
        );
      case "experience":
        return (
          <>
            <SectionTransition id="experience-transition" color="black" />
            <Experience
              key={section.id}
              section={section}
              onDataChange={handleDataChange}
            />
          </>
        );
      case "projects":
        return (
          <>
            <SectionTransition id="projects-transition" color="black" />
            <Projects
              key={section.id}
              section={section}
              onDataChange={handleDataChange}
              allCategoriesFromDB={allCategoriesFromDB}
            />
          </>
        );
      case "testimonials":
        return (
          <>
            <SectionTransition id="testimonials-transition" color="black" />
            <Testimonials
              key={section.id}
              section={section}
              onDataChange={handleDataChange}
            />
          </>
        );
      case "contact":
        return (
          <>
            <SectionTransition id="contact-transition" color="black" />
            <Contact
              key={section.id}
              section={section}
              onDataChange={handleDataChange}
            />
          </>
        );
      case "custom":
        return (
          <>
            <SectionTransition
              id={`custom-${section.slug}-transition`}
              color="black"
            />
            <CustomSection key={section.id} section={section} onDataChange={handleDataChange} />
          </>
        );
      default:
        console.warn("Unknown section type:", section.type);
        return null;
    }
  };

  if (isLoading && sections.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        Error loading page sections: {error}
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
      <Header sections={sections.filter((s) => s.visible)} />
      {sections
        .filter((s) => s.visible)
        .sort((a, b) => a.order - b.order)
        .map((section) => (
          <div key={section.id}>{renderSection(section)}</div>
        ))}
      <Footer />
      <ScrollToTop />
      <AdminIndicator />
      {isAdmin && <SectionManager />}
    </motion.div>
  );
}
