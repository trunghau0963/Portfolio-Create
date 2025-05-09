import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/skill-images - Create a new skill image
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sectionId, src, alt, caption, imagePublicId } = body;

    if (!sectionId || !src || !imagePublicId) {
      return NextResponse.json(
        {
          message:
            "Missing required fields: sectionId, src, and imagePublicId are required.",
        },
        { status: 400 }
      );
    }

    // Get the highest current order for images in this section
    const lastImage = await prisma.skillImage.findFirst({
      where: { sectionId: String(sectionId) },
      orderBy: { order: "desc" },
    });

    const newOrder = lastImage ? lastImage.order + 1 : 0;

    const newSkillImage = await prisma.skillImage.create({
      data: {
        sectionId: String(sectionId),
        src: String(src),
        imagePublicId: String(imagePublicId),
        alt: alt ? String(alt) : "Skill image",
        caption: caption ? String(caption) : null,
        order: newOrder,
      },
    });

    return NextResponse.json(newSkillImage, { status: 201 });
  } catch (error) {
    console.error("Error creating skill image:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON in request body." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
