import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/experience-images - Create a new detail image for an experience item
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { experienceItemId, src, alt, caption } = body;

    if (!experienceItemId || !src) {
      return NextResponse.json(
        { message: "Missing required fields (experienceItemId, src)" },
        { status: 400 }
      );
    }

    // Optional: Validate if experience item exists
    const experienceItem = await prisma.experienceItem.findUnique({
      where: { id: experienceItemId },
    });
    if (!experienceItem) {
      return NextResponse.json(
        { message: `Experience item with ID ${experienceItemId} not found` },
        { status: 404 }
      );
    }

    // Find the current max order for images in this specific experience item
    const maxOrderResult = await prisma.experienceDetailImage.aggregate({
      _max: {
        order: true,
      },
      where: {
        experienceItemId: experienceItemId,
      },
    });
    const newOrder = (maxOrderResult._max.order ?? -1) + 1;

    const newDetailImage = await prisma.experienceDetailImage.create({
      data: {
        experienceItemId,
        src,
        alt: alt || "Experience detail image", // Default alt text
        caption: caption || null,
        order: newOrder,
      },
    });

    return NextResponse.json(newDetailImage, { status: 201 });
  } catch (error) {
    console.error("Error creating experience detail image:", error);
    return NextResponse.json(
      {
        message: "Error creating experience detail image",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
