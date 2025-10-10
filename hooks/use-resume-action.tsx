import { useState, useEffect, useRef } from "react";
import { useSettings } from "@/context/settings-context";
import { toast } from "sonner";
import AnimatedSection from "@/components/ui/animated-section";
import { Loader2 } from "lucide-react";
import { set } from "mongoose";

// interface UseResumeActionOptions {
//     onSuccess?: () => void;
//     onError?: (error: Error) => void;
//     handleDownload?: (url: string, name: string) => Promise<void>;
//     handleUpdateClick?: () => void;
// }

export default function useResumeAction() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [downloadState, setDownloadState] = useState<
    "idle" | "downloading" | "success" | "error"
  >("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [isUploading, setIsUploading] = useState(false);

  const {
    settings,
    isLoading: settingsLoading,
    refreshSettings,
  } = useSettings();

  const resumeUrl = settings?.resumeUrl;
  const resumeName = resumeUrl
    ? resumeUrl
        .substring(resumeUrl.lastIndexOf("/") + 1)
        .replace(/^[0-9a-f]{8}-/, "")
    : "Your_Name_Resume.pdf";

  const handleDownload = () => {
    if (!resumeUrl) {
      toast.error("No resume URL available to download.");
      return;
    }

    setDownloadState("downloading");
    try {
      const link = document.createElement("a");
      link.href = resumeUrl;
      link.download = resumeUrl
        .substring(resumeUrl.lastIndexOf("/") + 1)
        .replace(/^[0-9a-f]{8}-/, "");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadState("success");
      toast.success("Resume download started!");
      setTimeout(() => setDownloadState("idle"), 2000);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Download failed. Please try again.");
      setDownloadState("error");
      setTimeout(() => setDownloadState("idle"), 2000);
    }
  };

  const handleUpdateClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleUpload = async (fileToUpload: File | null) => {
    if (!fileToUpload) {
      toast.error("No file selected for upload.");
      return;
    }

    setIsUploading(true);
    setUploadState("uploading");
    const formData = new FormData();
    formData.append("resumeFile", fileToUpload);

    try {
      const response = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Upload failed");
      }

      toast.success(result.message || "Resume uploaded successfully!");
      setUploadState("success");
      await refreshSettings();
      setSelectedFile(null);
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast.error(`Upload failed: ${error.message || "Please try again."}`);
      setUploadState("error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteResume = async () => {
    toast.info(
      "Delete functionality for cloud resume is not fully implemented yet."
    );
  };


  return {fileInputRef, settingsLoading, resumeUrl, resumeName, settings, isUploading, downloadState, setSelectedFile, handleDownload, handleUpdateClick, handleUpload, handleDeleteResume} as const;
}
