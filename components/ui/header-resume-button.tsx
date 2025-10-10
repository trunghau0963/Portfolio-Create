"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, FileText, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useResumeAction from "@/hooks/use-resume-action";

export default function HeaderResumeButton() {
  const { downloadState, handleDownload } = useResumeAction();

  return (
    <Button
      onClick={handleDownload}
      // disabled={isDownloading}
      variant="outline"
      size="sm"
      className="h-8 px-3 py-1"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={downloadState}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2"
        >
          {downloadState === "idle" && <FileText className="h-4 w-4" />}
          {downloadState === "downloading" && (
            <Loader2 className="animate-spin h-4 w-4" />
          )}
          {downloadState === "success" && <CheckCircle className="h-4 w-4" />}
          {downloadState === "error" && <AlertCircle className="h-4 w-4" />}
          <span>
            {downloadState === "idle" && "Resume"}
            {downloadState === "downloading" && "Downloading..."}
            {downloadState === "success" && "Downloaded!"}
            {downloadState === "error" && "Try Again"}
          </span>
        </motion.div>
      </AnimatePresence>
    </Button>
  );
}
