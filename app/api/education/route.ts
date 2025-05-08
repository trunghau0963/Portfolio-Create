import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/education - Create a new education item
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sectionId,
      institution,
      period,
      description,
      degree,
      // images are handled separately
    } = body;

    if (!sectionId || !institution || !period) {
      return NextResponse.json(
        { message: "Missing required fields (sectionId, institution, period)" },
        { status: 400 }
      );
    }

    // Find the current max order for items in this section
    const maxOrderResult = await prisma.educationItem.aggregate({
      _max: {
        order: true,
      },
      where: {
        sectionId: sectionId,
      },
    });
    const newOrder = (maxOrderResult._max.order ?? -1) + 1;

    const newEducationItem = await prisma.educationItem.create({
      data: {
        institution,
        period,
        description: description || "",
        degree: degree || "",
        order: newOrder,
        section: {
          connect: { id: sectionId },
        },
        // images: [], // Images relation handled separately
      },
    });

    return NextResponse.json(newEducationItem, { status: 201 });
  } catch (error) {
    console.error("Error creating education item:", error);
    return NextResponse.json(
      {
        message: "Error creating education item",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
