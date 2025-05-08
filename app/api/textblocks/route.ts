import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/textblocks - Create a new text block for a section
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sectionId, content } = body;

    if (!sectionId || content === undefined) {
      return NextResponse.json(
        { message: "Missing required fields (sectionId, content)" },
        { status: 400 }
      );
    }

    // Find the current max order for blocks in this section (consider both types)
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

    const newTextBlock = await prisma.textBlock.create({
      data: {
        content: content,
        order: newOrder,
        section: {
          connect: { id: sectionId },
        },
      },
    });

    return NextResponse.json(newTextBlock, { status: 201 });
  } catch (error) {
    console.error("Error creating text block:", error);
    return NextResponse.json(
      { message: "Error creating text block", error: String(error) },
      { status: 500 }
    );
  }
}
