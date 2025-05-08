import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/imageblocks - Create a new image block for a section
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // For now, expecting src directly. Real uploads need multipart/form-data handling.
    const { sectionId, src, alt, caption } = body;

    if (!sectionId || !src) {
      return NextResponse.json(
        { message: "Missing required fields (sectionId, src)" },
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
        src: src,
        alt: alt || "",
        caption: caption || "",
        order: newOrder,
        section: {
          connect: { id: sectionId },
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
