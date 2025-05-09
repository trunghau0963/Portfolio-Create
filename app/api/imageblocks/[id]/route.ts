import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ImageBlock } from "@/lib/generated/prisma";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Helper to delete from Cloudinary
async function deleteCloudinaryImage(publicId: string) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error(`Cloudinary delete error for ${publicId}:`, error);
        reject(error);
      } else {
        console.log(`Cloudinary delete result for ${publicId}:`, result);
        resolve(result);
      }
    });
  });
}

// Helper function to get ID from params
// function getIdFromRequest(request: Request): string | null {
//   const url = new URL(request.url);
//   const pathSegments = url.pathname.split("/");
//   // Assuming URL like /api/imageblocks/{id}
//   const id = pathSegments[pathSegments.length - 1];
//   return id || null;
// }

// PUT /api/imageblocks/[id] - Update an image block
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { width, height, src, imagePublicId } = body;

    // Validate the request body
    if (width !== undefined && (typeof width !== "number" || width <= 0)) {
      return new NextResponse("Invalid width value", { status: 400 });
    }
    if (height !== undefined && (typeof height !== "number" || height <= 0)) {
      return new NextResponse("Invalid height value", { status: 400 });
    }

    // Prepare update data
    const updateData: {
      width?: number;
      height?: number;
      src?: string;
      imagePublicId?: string;
    } = {};
    
    if (width !== undefined) updateData.width = width;
    if (height !== undefined) updateData.height = height;
    if (src !== undefined) updateData.src = src;
    if (imagePublicId !== undefined) updateData.imagePublicId = imagePublicId;

    // Update the image block
    const updatedImageBlock = await prisma.imageBlock.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updatedImageBlock);
  } catch (error) {
    console.error("[IMAGE_BLOCK_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE /api/imageblocks/[id] - Delete an image block
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id) {
    return NextResponse.json(
      { message: "Missing image block ID" },
      { status: 400 }
    );
  }
  try {
    // 1. Find the image to get public ID
    const imageToDelete = await prisma.imageBlock.findUnique({
      where: { id: id },
      select: { imagePublicId: true },
    });

    // 2. Delete from DB
    await prisma.imageBlock.delete({ where: { id: id } });

    // 3. Delete from Cloudinary if public ID exists
    if (imageToDelete?.imagePublicId) {
      try {
        await deleteCloudinaryImage(imageToDelete.imagePublicId);
      } catch (cloudinaryError) {
        console.error(
          `Failed to delete Cloudinary image ${imageToDelete.imagePublicId} after deleting image block ${id}:`,
          cloudinaryError
        );
        // Log error but continue, DB record is already deleted
      }
    }

    return NextResponse.json(
      { message: "Image block deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error deleting image block ${id}:`, error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: "Image block not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: `Error deleting image block ${id}`, error: String(error) },
      { status: 500 }
    );
  }
}
