"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import EditableText from "../ui/editable-text";
import EditablePortrait from "../ui/editable-portrait";
import AnimatedSection from "../ui/animated-section";
import { Button } from "@/components/ui/button";
import { Download, Eye, EyeOff, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";
import EditableTextAutoResize from "../ui/editable-text-auto-resize";
import {
  type Section as PrismaSection,
  type TextBlock as PrismaTextBlock,
  type HeroSectionContent as PrismaHeroContent,
} from "@/lib/generated/prisma";

// Extended Section type received as prop
interface HeroSectionProps {
  section: PrismaSection & {
    textBlocks: PrismaTextBlock[];
    heroContent: PrismaHeroContent | null;
    // Add other relations if needed later
  };
  onDataChange?: () => void;
}

export default function HeroSection({
  section,
  onDataChange,
}: HeroSectionProps) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;
  const [portraitPosition, setPortraitPosition] = useState<
    "left" | "center" | "right"
  >("center");
  const [resumeFile, setResumeFile] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPortraitState, setShowPortraitState] = useState(true);

  // Logic for resume (using localStorage for now)
  useEffect(() => {
    const storedResume = localStorage.getItem("portfolio-resume");
    if (storedResume) {
      const parsed = JSON.parse(storedResume);
      setResumeFile({ url: parsed.url, name: parsed.name });
    } else {
      setResumeFile({ url: "/resume.pdf", name: "Your_Name_Resume.pdf" });
    }
    // TODO: Replace localStorage with DB setting for portrait visibility
    const storedPortraitVisibility = localStorage.getItem(
      "portfolio-portrait-visibility"
    );
    if (storedPortraitVisibility !== null) {
      setShowPortraitState(storedPortraitVisibility === "true");
    } else if (section.heroContent) {
      // TODO: Read initial visibility from DB if available
      // setShowPortraitState(section.heroContent.showPortrait ?? true);
    } else if (section.type === "hero") {
      // Fallback for hero if heroContent somehow missing
      const globalSettingShow = localStorage.getItem(
        "portfolio-setting-showPortrait"
      ); // Example key
      if (globalSettingShow !== null) {
        setShowPortraitState(globalSettingShow === "true");
      }
    }
  }, [section.heroContent, section.type]); // Depend on section data

  // Save portrait visibility to localStorage when it changes - TODO: Update to save to DB
  useEffect(() => {
    localStorage.setItem(
      "portfolio-portrait-visibility",
      showPortraitState.toString()
    );
  }, [showPortraitState]);

  const handleDownload = () => {
    if (!resumeFile) return;
    setIsDownloading(true);
    setTimeout(() => {
      try {
        const link = document.createElement("a");
        link.href = resumeFile.url;
        link.download = resumeFile.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsDownloading(false);
      } catch (error) {
        console.error("Download failed:", error);
        setIsDownloading(false);
      }
    }, 800);
  };

  // Determine if portrait should be shown
  // TODO: Prioritize DB setting (global or heroContent specific) over localStorage state
  const showPortrait = showPortraitState;

  // Handler for saving TextBlocks in the Hero section
  const handleSaveTextBlock = async (
    blockId: string,
    newContent: string,
    newFontSize?: number,
    newFontFamily?: string
  ) => {
    try {
      const payload: {
        content: string;
        fontSize?: number;
        fontFamily?: string;
      } = { content: newContent };
      if (newFontSize !== undefined) payload.fontSize = newFontSize;
      if (newFontFamily !== undefined) payload.fontFamily = newFontFamily;

      const res = await fetch(`/api/textblocks/${blockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save text block");
      }
      if (onDataChange) onDataChange();
      else console.warn("HeroSection: onDataChange not provided.");
    } catch (error) {
      console.error("Error saving text block:", error);
    }
  };

  // Use data directly from the section prop
  const leftTextBlock = section.textBlocks?.[0];
  const rightTextBlock = section.textBlocks?.[1];

  return (
    <section className="shadow-sm dark:shadow-gray-900 dark:shadow-sm relative bg-gray-100 text-gray-900 pt-24 pb-12 md:pt-32 md:pb-16 lg:pt-36 lg:pb-20 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4">
        {/* Title Row */}
        <AnimatedSection variant="fadeInDown" duration={0.8}>
          <EditableTextAutoResize
            initialText={section.title}
            as="h1"
            className="text-red-600 text-7xl sm:text-8xl md:text-9xl lg:text-[180px] font-bold leading-none tracking-tighter"
          />
        </AnimatedSection>

        {/* Content Row */}
        <div className="relative">
          {/* Portrait Image - Only shown if showPortrait is true */}
          {showPortrait && (
            <div
              className={`absolute z-20 top-1/2 transform -translate-y-1/2 ${
                portraitPosition === "left"
                  ? "left-1/4 -translate-x-1/2"
                  : portraitPosition === "right"
                  ? "right-1/4 translate-x-1/2"
                  : "left-1/2 -translate-x-1/2"
              }`}
            >
              {/* <AnimatedSection variant="zoomIn" delay={0.3} duration={0.8}>
                <EditablePortrait
                  initialSrc={
                    section.heroContent?.portraitImageSrc ||
                    "/placeholder-portrait.jpg"
                  }
                  alt={section.heroContent?.portraitAlt || "Portrait"}
                  width={350}
                  height={500}
                  onPositionChange={setPortraitPosition}
                  currentPosition={portraitPosition}
                />
              </AnimatedSection> */}
            </div>
          )}

          {/* Text Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            {leftTextBlock ? (
              <AnimatedSection variant="fadeInLeft" delay={0.5} duration={0.8}>
                <div className="lg:col-span-6">
                  <EditableText
                    key={leftTextBlock.id}
                    initialText={leftTextBlock.content}
                    className="max-w-md"
                    initialFontSize={leftTextBlock.fontSize || 14}
                    initialFontFamily={leftTextBlock.fontFamily || "font-sans"}
                    blockId={leftTextBlock.id}
                    onCommitText={handleSaveTextBlock}
                  />
                </div>
              </AnimatedSection>
            ) : (
              <div></div>
            )}
            {rightTextBlock ? (
              <AnimatedSection variant="fadeInRight" delay={0.7} duration={0.8}>
                <div className="flex lg:col-span-6">
                  <EditableText
                    key={rightTextBlock.id}
                    initialText={rightTextBlock.content}
                    className="max-w-md"
                    initialFontSize={rightTextBlock.fontSize || 14}
                    initialFontFamily={rightTextBlock.fontFamily || "font-sans"}
                    blockId={rightTextBlock.id}
                    onCommitText={handleSaveTextBlock}
                  />
                  <motion.div
                    className="ml-4 mt-16"
                    animate={{ x: [0, 10, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-red-500"
                    >
                      <path d="M5 12h14"></path>
                      <path d="m12 5 7 7-7 7"></path>
                    </svg>
                  </motion.div>
                </div>
              </AnimatedSection>
            ) : (
              <div></div>
            )}
          </div>
        </div>

        {/* Controls Row */}
        <div className="mt-12 flex flex-wrap items-center gap-6">
          {/* Download Resume Button */}
          {/* {resumeFile && (
            <AnimatedSection variant="fadeIn" delay={0.9} duration={0.8}>
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>
                  {isDownloading ? "Downloading..." : "Download Resume"}
                </span>
              </Button>
            </AnimatedSection>
          )} */}

          {/* Portrait Toggle Switch - Only visible for admin */}
          {/* {isAdmin && (
            <AnimatedSection variant="fadeIn" delay={1} duration={0.8}>
              <div className="flex items-center space-x-2">
                <Switch
                  id="portrait-toggle"
                  checked={showPortrait}
                  onCheckedChange={setShowPortraitState}
                />
                <Label
                  htmlFor="portrait-toggle"
                  className="flex items-center gap-2"
                >
                  {showPortrait ? (
                    <>
                      <Eye className="h-4 w-4" />
                      <span>Hide Portrait</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span>Show Portrait</span>
                    </>
                  )}
                </Label>
              </div>
            </AnimatedSection>
          )} */}
        </div>

        {/* Dots */}
        <AnimatedSection variant="fadeIn" delay={1.1} duration={0.8}>
          <div className="flex mt-8 ml-1">
            <div className="w-2 h-2 rounded-full bg-red-600 mr-2"></div>
            <div className="w-2 h-2 rounded-full bg-red-600 mr-2"></div>
            <div className="w-2 h-2 rounded-full bg-red-600"></div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
