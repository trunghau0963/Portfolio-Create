import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

// Initialize rate limiter: 5 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success, limit, reset, remaining } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "X-Ratelimit-Limit": limit.toString(),
          "X-Ratelimit-Remaining": remaining.toString(),
          "X-Ratelimit-Reset": reset.toString(),
        },
      }
    );
  }

  const formData = await request.formData();
  const file = formData.get("resumeFile") as File | null;

  if (!file) {
    return NextResponse.json({ message: "No file provided." }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { message: "Invalid file type. Only PDF is allowed." },
      { status: 400 }
    );
  }

  // Max file size (e.g., 5MB)
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        message: `File size exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
      },
      { status: 400 }
    );
  }

  try {
    // Sanitize filename (optional, but good practice)
    const filename = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_").toLowerCase(); // Allow dots and hyphens
    const blob = await put(`resumes/${filename}`, file, {
      // Store in a 'resumes' folder in the blob
      access: "public", // Make the file publicly accessible
      contentType: "application/pdf", // Explicitly set content type
      addRandomSuffix: true, // Add a random suffix to avoid overwriting files with the same name
    });

    // Update the resumeUrl in the settings
    const currentSettings = await prisma.setting.findFirst();
    if (!currentSettings) {
      // This case should ideally be handled by ensuring settings are seeded/created
      return NextResponse.json(
        { message: "Settings not found. Cannot update resume URL." },
        { status: 500 }
      );
    }

    await prisma.setting.update({
      where: { id: currentSettings.id },
      data: { resumeUrl: blob.url },
    });

    return NextResponse.json({
      message: "Resume uploaded successfully!",
      resumeUrl: blob.url,
      blob: blob, // Return the full blob object if needed by client
    });
  } catch (error: any) {
    console.error("Error uploading resume or updating settings:", error);
    let errorMessage = "Failed to upload resume.";
    if (error && typeof error.message === "string") {
      errorMessage += ` Details: ${error.message}`;
    }
    // Ensure the error object passed to JSON is serializable
    const errorDetails =
      error && typeof error.message === "string"
        ? error.message
        : "Unknown error";
    return NextResponse.json(
      { message: errorMessage, error: errorDetails },
      { status: 500 }
    );
  }
}
