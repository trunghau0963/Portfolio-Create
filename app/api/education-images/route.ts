// Timeout: 120 s
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/education-images - Create a new image for an education item
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { educationItemId, src, alt, imagePublicId } = body;

    if (!educationItemId || !src || !imagePublicId) {
      return NextResponse.json(
        {
          message:
            "Missing required fields (educationItemId, src, imagePublicId)",
        },
        { status: 400 }
      );
    }

    // Verify educationItemId exists (optional but recommended)
    const educationItem = await prisma.educationItem.findUnique({
      where: { id: String(educationItemId) },
    });
    if (!educationItem) {
      return NextResponse.json(
        { message: `EducationItem with id ${educationItemId} not found.` },
        { status: 404 }
      );
    }

    // Determine the next order value
    const lastImage = await prisma.educationImage.findFirst({
      where: { educationItemId: String(educationItemId) },
      orderBy: { order: "desc" },
    });
    const newOrder = (lastImage?.order ?? -1) + 1;

    const newEducationImage = await prisma.educationImage.create({
      data: {
        educationItemId: String(educationItemId),
        src: String(src),
        alt: alt ? String(alt) : "Education detail image",
        imagePublicId: String(imagePublicId),
        order: newOrder,
      },
    });

    return NextResponse.json(newEducationImage, { status: 201 });
  } catch (error) {
    console.error("Error creating education image:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: (error as Error).message },
      { status: 500 }
    );
  }
}
