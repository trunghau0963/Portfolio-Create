import { NextResponse } from "next/server";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { Readable } from "stream";

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Use https
});

// Helper function to convert buffer to stream
function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("imageFile") as File | null;

    if (!file) {
      return NextResponse.json(
        { message: "No image file provided." },
        { status: 400 }
      );
    }

    // Validate file type (allow common image types)
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "Invalid file type. Only JPG, PNG, GIF, WebP are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (e.g., 10MB)
    const MAX_FILE_SIZE_MB = 10;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { message: `File size exceeds the limit of ${MAX_FILE_SIZE_MB}MB.` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Upload to Cloudinary using stream uploader
    const uploadResult = await new Promise<UploadApiResponse | undefined>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            // Optional: Specify folder, tags, etc.
            // folder: 'portfolio_uploads',
            // tags: ['portfolio', 'user_upload']
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        bufferToStream(fileBuffer).pipe(uploadStream);
      }
    );

    if (!uploadResult) {
      throw new Error("Cloudinary upload failed.");
    }

    // Return the secure URL and public ID
    return NextResponse.json({
      message: "Image uploaded successfully!",
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      original_filename: uploadResult.original_filename,
      width: uploadResult.width,
      height: uploadResult.height,
    });
  } catch (error: any) {
    console.error("Error uploading image:", error);
    let errorMessage = "Failed to upload image.";
    if (error.message) {
      errorMessage += ` Details: ${error.message}`;
    }
    return NextResponse.json(
      { message: errorMessage, error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}
