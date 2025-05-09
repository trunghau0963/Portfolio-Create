import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/experience-images - Create a new image for an experience item
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Destructure imagePublicId from the body
    const { experienceItemId, src, alt, imagePublicId } = body;

    // Add imagePublicId to the validation
    if (!experienceItemId || !src || !imagePublicId) {
      return NextResponse.json(
        {
          message:
            "Missing required fields (experienceItemId, src, imagePublicId)",
        },
        { status: 400 }
      );
    }

    // Verify experienceItemId exists (optional but recommended)
    const experienceItem = await prisma.experienceItem.findUnique({
      where: { id: String(experienceItemId) },
    });
    if (!experienceItem) {
      return NextResponse.json(
        { message: `ExperienceItem with id ${experienceItemId} not found.` },
        { status: 404 }
      );
    }

    // Determine the next order value
    const lastImage = await prisma.experienceDetailImage.findFirst({
      where: { experienceItemId: String(experienceItemId) },
      orderBy: { order: "desc" },
    });
    const newOrder = (lastImage?.order ?? -1) + 1;

    const newExperienceImage = await prisma.experienceDetailImage.create({
      data: {
        experienceItemId: String(experienceItemId),
        src: String(src), // Cloudinary URL
        alt: alt ? String(alt) : "Experience detail image", // Default alt text
        imagePublicId: String(imagePublicId), // Save public ID
        order: newOrder,
      },
    });

    return NextResponse.json(newExperienceImage, { status: 201 });
  } catch (error) {
    console.error("Error creating experience image:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: (error as Error).message },
      { status: 500 }
    );
  }
}
