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
import {
  type Section as ManagerSection,
  default as SectionManager,
} from "@/components/ui/section-manager";
import ScrollProgress from "@/components/ui/scroll-progress";
import ScrollToTop from "@/components/ui/scroll-to-top";
import { useAuth } from "@/context/auth-context";
import AdminIndicator from "@/components/admin-indicator";
import { motion } from "framer-motion";
import SectionTransition from "@/components/ui/section-transition";
import {
  type Section as PrismaSection,
  type TextBlock as PrismaTextBlock,
  type HeroSectionContent as PrismaHeroContent,
  type ImageBlock as PrismaImageBlock,
  type ContactInfoItem as PrismaContactInfoItem,
  type CustomSectionContentBlock as PrismaCustomSectionContentBlock,
  type EducationItem as PrismaEducationItem,
  type EducationImage as PrismaEducationImage,
  type SkillItem as PrismaSkillItem,
  type SkillImage as PrismaSkillImage,
  type ExperienceItem as PrismaExperienceItem,
  type ExperienceDetailImage as PrismaExperienceDetailImage,
  type ProjectItem as PrismaProjectItem,
  type TestimonialItem as PrismaTestimonialItem,
  type Category as PrismaCategory,
} from "@/lib/generated/prisma";

// Extend PrismaSection type to include expected relations
export type Section = PrismaSection & {
  textBlocks: PrismaTextBlock[];
  imageBlocks: PrismaImageBlock[];
  contactInfoItems: PrismaContactInfoItem[];
  customSectionContentBlocks: PrismaCustomSectionContentBlock[];
  heroContent: PrismaHeroContent | null;
  educationItems?: (PrismaEducationItem & { images: PrismaEducationImage[] })[];
  skillItems?: PrismaSkillItem[];
  skillImages?: PrismaSkillImage[];
  experienceItems?: (PrismaExperienceItem & {
    detailImages: PrismaExperienceDetailImage[];
  })[];
  projectItems?: PrismaProjectItem[];
  testimonialItems?: PrismaTestimonialItem[];
};

// This is the main client component for the page
export default function Home() {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;

  const [sections, setSections] = useState<Section[]>([]);
  const [allCategoriesFromDB, setAllCategoriesFromDB] = useState<
    PrismaCategory[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch all page data
  const fetchPageData = async () => {
    console.log("Refreshing page data...");
    try {
      const [sectionsResponse, categoriesResponse] = await Promise.all([
        fetch("/api/sections"),
        fetch("/api/categories"),
      ]);

      if (!sectionsResponse.ok) {
        throw new Error(
          `HTTP error! status: ${sectionsResponse.status} for sections`
        );
      }
      const sectionsData = await sectionsResponse.json();
      setSections(sectionsData as Section[]);

      if (!categoriesResponse.ok) {
        throw new Error(
          `HTTP error! status: ${categoriesResponse.status} for categories`
        );
      }
      const categoriesData = await categoriesResponse.json();
      setAllCategoriesFromDB(categoriesData as PrismaCategory[]);
      setError(null); // Clear error on successful fetch
    } catch (e) {
      console.error("Failed to fetch page data:", e);
      setError(e instanceof Error ? e.message : "An unknown error occurred");
    } finally {
      if (loading) setLoading(false);
    }
  };

  // Fetch data on initial mount
  useEffect(() => {
    fetchPageData();
  }, []); // Empty dependency array means run once on mount

  console.log("Fetched sections on page:", sections);
  // console.log("Fetched categories on page:", allCategoriesFromDB);

  const renderSection = (section: Section) => {
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
              onDataChange={fetchPageData}
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
              onDataChange={fetchPageData}
            />
          </>
        );
      case "skills":
        return (
          <>
            <SectionTransition id="skills-transition" color="black" />
            <Skills key={section.id} section={section} />
          </>
        );
      case "experience":
        return (
          <>
            <SectionTransition id="experience-transition" color="black" />
            <Experience
              key={section.id}
              section={section}
              onDataChange={fetchPageData}
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
              allCategoriesFromDB={allCategoriesFromDB}
            />
          </>
        );
      case "testimonials":
        return (
          <>
            <SectionTransition id="testimonials-transition" color="black" />
            <Testimonials key={section.id} section={section} />
          </>
        );
      case "contact":
        return (
          <>
            <SectionTransition id="contact-transition" color="black" />
            <Contact
              key={section.id}
              section={section}
              onDataChange={fetchPageData}
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
            <CustomSection key={section.id} section={section} />
          </>
        );
      default:
        console.warn("Unknown section type:", section.type);
        return null;
    }
  };

  if (loading) {
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
