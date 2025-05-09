import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import { ExperienceDetailImage } from "@/lib/generated/prisma"; // Import type if needed

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

// PUT /api/experience-images/[id] - Update an experience detail image
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ message: "Missing ID" }, { status: 400 });
  }
  try {
    const body = await request.json();
    const { src, alt, caption, order, imagePublicId } = body;

    const updateData: Partial<
      Pick<
        ExperienceDetailImage,
        "src" | "alt" | "caption" | "order" | "imagePublicId"
      >
    > = {};
    if (src !== undefined) updateData.src = src;
    if (alt !== undefined) updateData.alt = alt;
    if (caption !== undefined) updateData.caption = caption;
    if (order !== undefined) updateData.order = Number(order);
    if (imagePublicId !== undefined) updateData.imagePublicId = imagePublicId;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No fields provided for update" },
        { status: 400 }
      );
    }

    let oldPublicId: string | null = null;
    if (updateData.src || updateData.imagePublicId) {
      const existingImage = await prisma.experienceDetailImage.findUnique({
        where: { id: id },
        select: { imagePublicId: true },
      });
      if (existingImage?.imagePublicId) {
        oldPublicId = existingImage.imagePublicId;
      }
    }

    const updatedItem = await prisma.experienceDetailImage.update({
      where: { id: id },
      data: updateData,
    });

    if (oldPublicId && oldPublicId !== updatedItem.imagePublicId) {
      try {
        await deleteCloudinaryImage(oldPublicId);
      } catch (cloudinaryError) {
        console.error(
          `Failed to delete old Cloudinary image ${oldPublicId}:`,
          cloudinaryError
        );
      }
    }

    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error(`Error updating experience detail image ${id}:`, error);
    if (error.code === "P2025") {
      return NextResponse.json({ message: "Image not found" }, { status: 404 });
    }
    return NextResponse.json(
      { message: `Error updating image ${id}`, error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/experience-images/[id] - Delete an experience detail image
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json(
      { message: "Missing experience detail image ID" },
      { status: 400 }
    );
  }

  try {
    // 1. Find the image to get public ID
    const imageToDelete = await prisma.experienceDetailImage.findUnique({
      where: { id: id },
      select: { imagePublicId: true },
    });

    // 2. Delete from DB
    await prisma.experienceDetailImage.delete({
      where: { id: id },
    });

    // 3. Delete from Cloudinary if public ID exists
    if (imageToDelete?.imagePublicId) {
      try {
        await deleteCloudinaryImage(imageToDelete.imagePublicId);
      } catch (cloudinaryError) {
        console.error(
          `Failed to delete Cloudinary image ${imageToDelete.imagePublicId}:`,
          cloudinaryError
        );
        // Log error but continue
      }
    }

    return NextResponse.json(
      { message: `Experience detail image ${id} deleted successfully` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error deleting experience detail image ${id}:`, error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: `Experience detail image with ID ${id} not found` },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        message: `Error deleting experience detail image ${id}`,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
