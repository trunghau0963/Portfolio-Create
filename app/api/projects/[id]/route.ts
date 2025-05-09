import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Helper to delete Cloudinary image
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

interface RouteParams {
  id: string;
}

// PUT /api/projects/[id] - Update a project item
export async function PUT(
  request: Request,
  { params }: { params: RouteParams }
) {
  const { id } = params;
  try {
    const body = await request.json();
    // Destructure all potential fields from body
    const {
      title,
      description1,
      description2,
      imageSrc,
      imagePublicId,
      layout,
      projectNumber,
      companyName,
      liveLink,
      sourceLink,
      categoryIds,
    } = body;

    // Type for updateData - Explicitly define allowed fields
    type ProjectUpdateData = {
      title?: string;
      description1?: string;
      description2?: string | null; // Allow null for optional fields
      imageSrc?: string;
      imagePublicId?: string;
      layout?: string;
      projectNumber?: string | null;
      companyName?: string | null;
      liveLink?: string | null;
      sourceLink?: string | null;
      categoryIds?: string[];
    };

    const updateData: ProjectUpdateData = {};

    // Assign values only if they are defined in the body
    if (title !== undefined) updateData.title = String(title);
    if (description1 !== undefined)
      updateData.description1 = String(description1);
    if (description2 !== undefined)
      updateData.description2 =
        description2 === null ? null : String(description2);
    if (imageSrc !== undefined) updateData.imageSrc = String(imageSrc);
    if (imagePublicId !== undefined)
      updateData.imagePublicId = String(imagePublicId);
    if (layout !== undefined && (layout === "layout1" || layout === "layout2"))
      updateData.layout = layout;
    if (projectNumber !== undefined)
      updateData.projectNumber =
        projectNumber === null ? null : String(projectNumber);
    if (companyName !== undefined)
      updateData.companyName =
        companyName === null ? null : String(companyName);
    if (liveLink !== undefined)
      updateData.liveLink = liveLink === null ? null : String(liveLink);
    if (sourceLink !== undefined)
      updateData.sourceLink = sourceLink === null ? null : String(sourceLink);

    // Validate and assign categoryIds
    if (categoryIds !== undefined) {
      if (!Array.isArray(categoryIds)) {
        return NextResponse.json(
          { message: "categoryIds must be an array." },
          { status: 400 }
        );
      }
      // Filter out non-string category IDs
      updateData.categoryIds = categoryIds.filter(
        (catId) => typeof catId === "string"
      );
    }

    // Handle image update logic
    let oldPublicId: string | null = null;
    if (updateData.imageSrc || updateData.imagePublicId) {
      const existingProject = await prisma.projectItem.findUnique({
        where: { id: String(id) },
        select: { imagePublicId: true },
      });
      if (existingProject?.imagePublicId) {
        oldPublicId = existingProject.imagePublicId;
      }
      // Ensure imagePublicId is provided if imageSrc is changing
      if (updateData.imageSrc && updateData.imagePublicId === undefined) {
        return NextResponse.json(
          { message: "imagePublicId is required when updating imageSrc." },
          { status: 400 }
        );
      }
    } else {
      // Prevent accidental clearing if not provided
      delete updateData.imageSrc;
      delete updateData.imagePublicId;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No valid fields provided for update." },
        { status: 400 }
      );
    }

    const updatedProject = await prisma.projectItem.update({
      where: { id: String(id) },
      data: updateData,
    });

    // Delete old image from Cloudinary if necessary
    if (oldPublicId && oldPublicId !== updatedProject.imagePublicId) {
      try {
        await deleteCloudinaryImage(oldPublicId);
      } catch (cloudinaryError) {
        console.error(
          `Failed to delete old Cloudinary image ${oldPublicId}:`,
          cloudinaryError
        );
      }
    }

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error(`Error updating project item ${id}:`, error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON in request body." },
        { status: 400 }
      );
    }
    if (error instanceof PrismaClientKnownRequestError) {
      console.error("Prisma Error Code:", error.code);
      console.error("Prisma Error Meta:", error.meta);
      if (error.code === "P2025") {
        return NextResponse.json(
          {
            message: `Project item with ID ${id} not found.`,
            prismaCode: error.code,
          },
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          message: "Database error during update.",
          prismaCode: error.code,
          details: error.message,
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      {
        message: "Internal Server Error",
        errorDetails: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete a project item
export async function DELETE(
  request: Request,
  { params }: { params: RouteParams }
) {
  const { id } = params;
  try {
    // 1. Find project to get imagePublicId
    const projectToDelete = await prisma.projectItem.findUnique({
      where: { id: String(id) },
      select: { imagePublicId: true, categoryIds: true }, // Also get categoryIds
    });

    // 2. Remove project ID from associated Categories
    if (projectToDelete?.categoryIds?.length) {
      for (const categoryId of projectToDelete.categoryIds) {
        await prisma.category.updateMany({
          where: { id: categoryId },
          data: {
            projectIds: {
              set: (
                await prisma.category.findUnique({
                  where: { id: categoryId },
                  select: { projectIds: true },
                })
              )?.projectIds.filter((pId) => pId !== id),
            },
          },
        });
      }
    }

    // 3. Delete project from DB
    await prisma.projectItem.delete({
      where: { id: String(id) },
    });

    // 4. Delete image from Cloudinary
    if (projectToDelete?.imagePublicId) {
      try {
        await deleteCloudinaryImage(projectToDelete.imagePublicId);
      } catch (cloudinaryError) {
        console.error(
          `Failed to delete Cloudinary image ${projectToDelete.imagePublicId}:`,
          cloudinaryError
        );
      }
    }

    return NextResponse.json(
      { message: `Project item ${id} deleted successfully.` },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting project item ${id}:`, error);
    if ((error as any).code === "P2025") {
      return NextResponse.json(
        { message: `Project item with ID ${id} not found.` },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
