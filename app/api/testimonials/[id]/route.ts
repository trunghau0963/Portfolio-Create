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

interface RouteContext {
  params: {
    id: string;
  };
}

// PUT /api/testimonials/[id] - Update a testimonial
export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = params;
  try {
    const body = await request.json();
    const {
      clientName,
      role,
      company,
      content,
      rating,
      imageSrc,
      imagePublicId,
      order,
    } = body;

    const updateData: {
      clientName?: string;
      role?: string | null;
      company?: string | null;
      content?: string;
      rating?: number;
      imageSrc?: string | null;
      imagePublicId?: string | null;
      order?: number;
    } = {};

    if (clientName !== undefined) updateData.clientName = String(clientName);
    if (role !== undefined) updateData.role = role ? String(role) : null;
    if (company !== undefined)
      updateData.company = company ? String(company) : null;
    if (content !== undefined) updateData.content = String(content);
    if (rating !== undefined) {
      const parsedRating = Number(rating);
      if (!isNaN(parsedRating) && parsedRating >= 0 && parsedRating <= 5) {
        updateData.rating = parsedRating;
      } else {
        return NextResponse.json(
          {
            message: "Invalid rating value. Must be a number between 0 and 5.",
          },
          { status: 400 }
        );
      }
    }
    if (imageSrc !== undefined)
      updateData.imageSrc = imageSrc ? String(imageSrc) : null;
    if (imagePublicId !== undefined)
      updateData.imagePublicId = imagePublicId ? String(imagePublicId) : null;
    if (order !== undefined) updateData.order = Number(order);

    let oldPublicId: string | null = null;
    if (updateData.imageSrc || updateData.imagePublicId !== undefined) {
      if (updateData.imageSrc || updateData.imagePublicId !== undefined) {
        const existingTestimonial = await prisma.testimonialItem.findUnique({
          where: { id: String(id) },
          select: { imagePublicId: true },
        });
        if (existingTestimonial?.imagePublicId) {
          oldPublicId = existingTestimonial.imagePublicId;
        }
        if (updateData.imageSrc && updateData.imagePublicId === undefined) {
          return NextResponse.json(
            { message: "imagePublicId is required when updating imageSrc." },
            { status: 400 }
          );
        }
      }
    } else {
      delete updateData.imageSrc;
      delete updateData.imagePublicId;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No valid fields provided for update." },
        { status: 400 }
      );
    }

    const updatedTestimonial = await prisma.testimonialItem.update({
      where: { id: String(id) },
      data: updateData,
    });

    if (oldPublicId && oldPublicId !== updatedTestimonial.imagePublicId) {
      try {
        await deleteCloudinaryImage(oldPublicId);
      } catch (cloudinaryError) {
        console.error(
          `Failed to delete old Cloudinary image ${oldPublicId}:`,
          cloudinaryError
        );
      }
    }

    return NextResponse.json(updatedTestimonial);
  } catch (error) {
    console.error(`Error updating testimonial ${id}:`, error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: `Testimonial with ID ${id} not found.` },
        { status: 404 }
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

// DELETE /api/testimonials/[id] - Delete a testimonial
export async function DELETE(request: Request, { params }: RouteContext) {
  const { id } = params;
  try {
    const testimonialToDelete = await prisma.testimonialItem.findUnique({
      where: { id: String(id) },
      select: { imagePublicId: true },
    });

    await prisma.testimonialItem.delete({
      where: { id: String(id) },
    });

    if (testimonialToDelete?.imagePublicId) {
      try {
        await deleteCloudinaryImage(testimonialToDelete.imagePublicId);
      } catch (cloudinaryError) {
        console.error(
          `Failed to delete Cloudinary image ${testimonialToDelete.imagePublicId}:`,
          cloudinaryError
        );
      }
    }

    return NextResponse.json(
      { message: `Testimonial ${id} deleted successfully.` },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting testimonial ${id}:`, error);
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: `Testimonial with ID ${id} not found.` },
        { status: 404 }
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
