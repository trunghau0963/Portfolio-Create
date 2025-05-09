import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/imageblocks - Create a new image block for a section
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Destructure imagePublicId from body
    const { sectionId, src, alt, caption, imagePublicId } = body;

    // Update required fields check
    if (!sectionId || !src || !imagePublicId) {
      return NextResponse.json(
        {
          message: "Missing required fields (sectionId, src, imagePublicId)",
        },
        { status: 400 }
      );
    }

    // Find max order
    const maxTextBlockOrder = await prisma.textBlock.aggregate({
      _max: { order: true },
      where: { sectionId },
    });
    const maxImageBlockOrder = await prisma.imageBlock.aggregate({
      _max: { order: true },
      where: { sectionId },
    });
    const newOrder =
      Math.max(
        maxTextBlockOrder._max.order ?? -1,
        maxImageBlockOrder._max.order ?? -1
      ) + 1;

    const newImageBlock = await prisma.imageBlock.create({
      data: {
        src: String(src),
        imagePublicId: String(imagePublicId),
        alt: alt ? String(alt) : "",
        caption: caption ? String(caption) : null,
        order: newOrder,
        section: {
          connect: { id: String(sectionId) },
        },
      },
    });

    return NextResponse.json(newImageBlock, { status: 201 });
  } catch (error) {
    console.error("Error creating image block:", error);
    return NextResponse.json(
      { message: "Error creating image block", error: String(error) },
      { status: 500 }
    );
  }
}
