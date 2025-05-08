import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/skills - Create a new skill item
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sectionId, // Expect sectionId (should be the ID of the 'skills' section)
      title,
      description,
      level,
    } = body;

    // Validate required skill fields
    if (!sectionId || !title) {
      return NextResponse.json(
        { message: "Missing required fields (sectionId, title)" },
        { status: 400 }
      );
    }

    // Find the section document to connect to (ensure sectionId is valid)
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
    });
    if (!section) {
      return NextResponse.json(
        { message: `Section with ID ${sectionId} not found` },
        { status: 404 }
      );
    }

    // Find the current max order for items in this section
    const maxOrderResult = await prisma.skillItem.aggregate({
      _max: {
        order: true,
      },
      where: {
        sectionId: sectionId,
      },
    });
    const newOrder = (maxOrderResult._max.order ?? -1) + 1;

    const newSkillItem = await prisma.skillItem.create({
      data: {
        title,
        description: description || "", // Default description if not provided
        level: typeof level === "number" ? level : 0, // Default level if not provided/invalid
        order: newOrder,
        section: {
          connect: { id: sectionId },
        },
      },
    });

    return NextResponse.json(newSkillItem, { status: 201 });
  } catch (error) {
    console.error("Error creating skill item:", error);
    return NextResponse.json(
      {
        message: "Error creating skill item",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
