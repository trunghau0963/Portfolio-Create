import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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

// PUT /api/experience/[id] - Update an experience item
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json(
      { message: "Missing experience item ID" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const {
      positionTitle,
      companyName,
      period,
      summary,
      description,
      imageSrc, // Cloudinary URL
      imagePublicId, // Cloudinary Public ID
    } = body;

    const dataToUpdate: any = {};
    if (positionTitle !== undefined)
      dataToUpdate.positionTitle = String(positionTitle);
    if (companyName !== undefined)
      dataToUpdate.companyName = String(companyName);
    if (period !== undefined) dataToUpdate.period = String(period);
    if (summary !== undefined)
      dataToUpdate.summary = summary === null ? null : String(summary);
    if (description !== undefined)
      dataToUpdate.description =
        description === null ? null : String(description);
    if (imageSrc !== undefined) dataToUpdate.imageSrc = String(imageSrc);
    if (imagePublicId !== undefined)
      dataToUpdate.imagePublicId = String(imagePublicId);

    // Handle image deletion logic
    let oldPublicId: string | null = null;
    if (dataToUpdate.imageSrc || dataToUpdate.imagePublicId) {
      const existingExp = await prisma.experienceItem.findUnique({
        where: { id: id },
        select: { imagePublicId: true },
      });
      if (existingExp?.imagePublicId) {
        oldPublicId = existingExp.imagePublicId;
      }
      if (dataToUpdate.imageSrc && dataToUpdate.imagePublicId === undefined) {
        return NextResponse.json(
          { message: "imagePublicId is required when updating imageSrc." },
          { status: 400 }
        );
      }
    } else {
      delete dataToUpdate.imageSrc;
      delete dataToUpdate.imagePublicId;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { message: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    const updatedItem = await prisma.experienceItem.update({
      where: { id: id },
      data: dataToUpdate,
    });

    // Delete old Cloudinary image if necessary
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
    console.error(`Error updating experience item ${id}:`, error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: `Experience item with ID ${id} not found` },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        message: `Error updating experience item ${id}`,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE /api/experience/[id] - Delete an experience item
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json(
      { message: "Missing experience item ID" },
      { status: 400 }
    );
  }

  try {
    // 1. Find ExperienceItem to get the main image public ID and related detail image IDs/publicIDs
    const experienceToDelete = await prisma.experienceItem.findUnique({
      where: { id: id },
      select: {
        imagePublicId: true,
        detailImages: {
          select: { id: true, imagePublicId: true },
        },
      },
    });

    // 2. Delete related ExperienceDetailImages from DB and Cloudinary
    if (experienceToDelete?.detailImages?.length) {
      const detailImageIds = experienceToDelete.detailImages.map(
        (img) => img.id
      );
      const detailImagePublicIds = experienceToDelete.detailImages
        .map((img) => img.imagePublicId)
        .filter((pid) => !!pid);

      await prisma.experienceDetailImage.deleteMany({
        where: { id: { in: detailImageIds } },
      });

      for (const publicId of detailImagePublicIds) {
        if (publicId) {
          // Double check just in case
          try {
            await deleteCloudinaryImage(publicId);
          } catch (cloudinaryError) {
            console.error(
              `Failed to delete Cloudinary detail image ${publicId} for experience ${id}:`,
              cloudinaryError
            );
          }
        }
      }
    }

    // 3. Delete the ExperienceItem from DB
    await prisma.experienceItem.delete({
      where: { id: id },
    });

    // 4. Delete the main ExperienceItem image from Cloudinary
    if (experienceToDelete?.imagePublicId) {
      try {
        await deleteCloudinaryImage(experienceToDelete.imagePublicId);
      } catch (cloudinaryError) {
        console.error(
          `Failed to delete main Cloudinary image ${experienceToDelete.imagePublicId} for experience ${id}:`,
          cloudinaryError
        );
      }
    }

    return NextResponse.json(
      { message: `Experience item ${id} deleted successfully` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error deleting experience item ${id}:`, error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: `Experience item with ID ${id} not found` },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        message: `Error deleting experience item ${id}`,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
