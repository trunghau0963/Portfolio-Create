import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary (ensure your env variables are set)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

interface RouteParams {
  id: string;
}

// Helper function to delete image from Cloudinary
async function deleteCloudinaryImage(publicId: string) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error(`Cloudinary delete error for ${publicId}:`, error);
        reject(error);
      } else {
        console.log(`Cloudinary delete result for ${publicId}:`, result);
        // result.result === 'ok' or 'not found'
        resolve(result);
      }
    });
  });
}

// PUT /api/skill-images/[id] - Update a skill image
export async function PUT(
  request: Request,
  { params }: { params: RouteParams }
) {
  const { id } = params;
  try {
    const body = await request.json();
    // Get potential new src and publicId, along with other fields
    const { src, alt, caption, order, imagePublicId } = body;

    const updateData: any = {};
    if (alt !== undefined) updateData.alt = String(alt);
    if (caption !== undefined)
      updateData.caption = caption ? String(caption) : null;
    if (order !== undefined) updateData.order = Number(order);
    // Only update src and publicId if they are provided
    if (src !== undefined) updateData.src = String(src);
    if (imagePublicId !== undefined)
      updateData.imagePublicId = String(imagePublicId);

    // If src is being updated, we assume a new image was uploaded via /api/images/upload
    // and the new publicId is provided. We need to delete the OLD image from Cloudinary.
    let oldPublicId: string | null = null;
    if (src !== undefined || imagePublicId !== undefined) {
      // Find the existing record to get the old public ID
      const existingImage = await prisma.skillImage.findUnique({
        where: { id: String(id) },
        select: { imagePublicId: true },
      });
      if (existingImage?.imagePublicId) {
        oldPublicId = existingImage.imagePublicId;
      }
    }

    // Perform the database update
    const updatedSkillImage = await prisma.skillImage.update({
      where: { id: String(id) },
      data: updateData,
    });

    // If we found an old public ID and either src or imagePublicId was updated,
    // delete the old image from Cloudinary AFTER successful DB update.
    // Also ensure the new publicId is different from the old one (if both exist).
    if (oldPublicId && oldPublicId !== updatedSkillImage.imagePublicId) {
      try {
        await deleteCloudinaryImage(oldPublicId);
      } catch (cloudinaryError) {
        // Log the error but don't fail the request, as DB update succeeded
        console.error(
          `Failed to delete old Cloudinary image ${oldPublicId} after updating skill image ${id}:`,
          cloudinaryError
        );
      }
    }

    return NextResponse.json(updatedSkillImage, { status: 200 });
  } catch (error: any) {
    console.error(`Error updating skill image ${id}:`, error);
    if (error.code === "P2025") {
      // Prisma: Record to update not found.
      return NextResponse.json(
        { message: `Skill image with ID ${id} not found.` },
        { status: 404 }
      );
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON in request body." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/skill-images/[id] - Delete a skill image
export async function DELETE(
  request: Request,
  { params }: { params: RouteParams }
) {
  const { id } = params;
  try {
    // 1. Find the image record to get the public ID before deleting
    const imageToDelete = await prisma.skillImage.findUnique({
      where: { id: String(id) },
      select: { imagePublicId: true }, // Only select the public ID
    });

    // 2. Delete the database record
    await prisma.skillImage.delete({
      where: { id: String(id) },
    });

    // 3. If a public ID exists, delete the image from Cloudinary AFTER successful DB deletion
    if (imageToDelete?.imagePublicId) {
      try {
        await deleteCloudinaryImage(imageToDelete.imagePublicId);
      } catch (cloudinaryError) {
        // Log the error but don't fail the request, as DB deletion succeeded
        console.error(
          `Failed to delete Cloudinary image ${imageToDelete.imagePublicId} after deleting skill image ${id}:`,
          cloudinaryError
        );
      }
    }

    return NextResponse.json(
      { message: `Skill image ${id} deleted successfully.` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error deleting skill image ${id}:`, error);
    if (error.code === "P2025") {
      // PrismaClientKnownRequestError: Record to delete not found.
      return NextResponse.json(
        { message: `Skill image with ID ${id} not found.` },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
