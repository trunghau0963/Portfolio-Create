"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Trash2,
  Calendar,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import AnimatedSection from "./animated-section";
import { useSettings } from "@/context/settings-context";
import { toast } from "sonner";
import useResumeAction from "@/hooks/use-resume-action";

export default function ResumeManager({
  className = "",
}: {
  className?: string;
}) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;

  const {
    fileInputRef,
    settingsLoading,
    resumeUrl,
    resumeName,
    settings,
    isUploading,
    downloadState,
    setSelectedFile,
    handleDownload,
    handleUpdateClick,
    handleUpload,
    handleDeleteResume,
  } = useResumeAction();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.type !== "application/pdf") {
        toast.error("Invalid file type. Please select a PDF.");
        return;
      }
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        toast.error(
          `File size exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
        );
        return;
      }

      setSelectedFile(file);
      await handleUpload(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "N/A";
    try {
      const date =
        typeof dateString === "string" ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) return "Invalid Date";

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "N/A";
    }
  };

  if (settingsLoading && !resumeUrl) {
    return (
      <AnimatedSection
        variant="fadeInUp"
        className={`bg-red-600 text-white p-4 sm:p-6 rounded-lg shadow-md ${className}`}
      >
        <div className="flex items-center justify-center h-20">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="ml-2">Loading resume information...</p>
        </div>
      </AnimatedSection>
    );
  }

  const hiddenFileInput = (
    <input
      type="file"
      ref={fileInputRef}
      onChange={handleFileChange}
      accept=".pdf"
      style={{ display: "none" }}
    />
  );

  return (
    <AnimatedSection
      variant="fadeInUp"
      className={`bg-red-600 text-white p-4 sm:p-6 rounded-lg shadow-md ${className}`}
    >
      {hiddenFileInput}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Resume</h3>
              <p className="text-sm text-white/80">
                {isAdmin
                  ? "Manage and download your resume"
                  : "Download my complete resume"}
              </p>
            </div>
          </div>

          <Button
            onClick={handleDownload}
            disabled={downloadState !== "idle" || !resumeUrl}
            variant="secondary"
            className="border-white  hover:bg-gray-100/80 min-w-[160px] justify-center relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={downloadState}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                {downloadState === "idle" && <Download className="h-4 w-4" />}
                {downloadState === "downloading" && (
                  <Loader2 className="animate-spin h-4 w-4" />
                )}
                {downloadState === "success" && (
                  <CheckCircle className="h-4 w-4" />
                )}
                {downloadState === "error" && (
                  <AlertCircle className="h-4 w-4" />
                )}
                <span>
                  {downloadState === "idle" && "Download Resume"}
                  {downloadState === "downloading" && "Downloading..."}
                  {downloadState === "success" && "Downloaded!"}
                  {downloadState === "error" && "Try Again"}
                </span>
              </motion.div>
            </AnimatePresence>
          </Button>
        </div>

        {isAdmin && resumeUrl && (
          <div className="mt-2 bg-white/10 rounded-md p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-white/80" />
              <div>
                <p className="text-sm font-medium" title={resumeUrl}>
                  {resumeName}
                </p>
                <div className="flex items-center gap-3 text-xs text-white/70">
                  <span>
                    Last updated:{" "}
                    {settings?.updatedAt
                      ? formatDate(settings.updatedAt as string)
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                onClick={handleUpdateClick}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 hover:text-white"
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1 h-4 w-4" />
                )}
                Update
              </Button>
              <Button
                onClick={handleDeleteResume}
                variant="ghost"
                size="sm"
                className="text-red-300 hover:bg-red-700/50 hover:text-red-200"
                disabled
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {isAdmin && !resumeUrl && !settingsLoading && (
          <div className="mt-4 text-center">
            <p className="text-sm text-white/80 mb-2">
              No resume has been uploaded yet.
            </p>
            <Button
              onClick={handleUpdateClick}
              variant="secondary"
              className="border-white hover:bg-gray-100/80"
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              Upload Resume
            </Button>
          </div>
        )}
      </div>
    </AnimatedSection>
  );
}
