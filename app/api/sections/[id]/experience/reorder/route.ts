import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json(
      { message: "Missing section ID" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { orderedIds } = body;

    if (
      !Array.isArray(orderedIds) ||
      orderedIds.some((val) => typeof val !== "string")
    ) {
      return NextResponse.json(
        {
          message:
            "Invalid 'orderedIds' payload. It should be an array of strings.",
        },
        { status: 400 }
      );
    }

    // Optional: Check if the section exists
    const section = await prisma.section.findUnique({
      where: { id: id },
    });
    if (!section) {
      return NextResponse.json(
        { message: `Section with ID ${id} not found` },
        { status: 404 }
      );
    }

    // Perform updates in a transaction
    const updateOperations = orderedIds.map((itemId, index) =>
      prisma.experienceItem.updateMany({
        where: {
          id: itemId,
          sectionId: id, // Ensure item belongs to the section
        },
        data: {
          order: index,
        },
      })
    );

    await prisma.$transaction(updateOperations);

    return NextResponse.json({
      message: "Experience items reordered successfully",
    });
  } catch (error: any) {
    console.error(
      `Error reordering experience items for section ${id}:`,
      error
    );
    if (error.code === "P2025") {
      return NextResponse.json(
        {
          message: `One or more experience items not found or do not belong to section ${id}.`,
        },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        message: `Error reordering experience items for section ${id}`,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
