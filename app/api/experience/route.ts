import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/experience - Create a new experience item
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sectionId,
      positionTitle,
      companyName,
      period,
      summary,
      description,
      imageSrc,
      // detailImages are handled separately or upon creation if needed
    } = body;

    if (!sectionId || !positionTitle || !companyName || !period) {
      return NextResponse.json(
        {
          message:
            "Missing required fields (sectionId, positionTitle, companyName, period)",
        },
        { status: 400 }
      );
    }

    // Find the current max order for items in this section
    const maxOrderResult = await prisma.experienceItem.aggregate({
      _max: {
        order: true,
      },
      where: {
        sectionId: sectionId,
      },
    });
    const newOrder = (maxOrderResult._max.order ?? -1) + 1;

    const newExperienceItem = await prisma.experienceItem.create({
      data: {
        sectionId,
        positionTitle,
        companyName,
        period,
        summary: summary || "",
        description: description || "",
        imageSrc: imageSrc || "", // Handle optional image source
        order: newOrder,
        // detailImages: {}, // Relation handled separately
      },
      // Include detailImages if you want to return them immediately (empty array initially)
      include: {
        detailImages: true,
      },
    });

    return NextResponse.json(newExperienceItem, { status: 201 });
  } catch (error) {
    console.error("Error creating experience item:", error);
    return NextResponse.json(
      {
        message: "Error creating experience item",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
