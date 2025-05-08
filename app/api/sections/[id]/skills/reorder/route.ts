import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id: sectionId } = params;
  if (!sectionId) {
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

    // Check if the section exists
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      return NextResponse.json(
        { message: `Section with ID ${sectionId} not found` },
        { status: 404 }
      );
    }

    // Perform updates in a transaction
    const updateOperations = orderedIds.map((itemId, index) =>
      prisma.educationItem.updateMany({
        where: {
          id: itemId,
          sectionId: sectionId,
        },
        data: {
          order: index,
        },
      })
    );

    // We use a transaction to ensure all updates succeed or fail together.
    // Note: updateMany returns a count. We're not directly checking individual item existence here
    // before update for simplicity, but assuming orderedIds contains valid items for the section.
    // A more robust solution might involve fetching all items first to validate.
    await prisma.$transaction(updateOperations);

    return NextResponse.json({
      message: "Education items reordered successfully",
    });
  } catch (error: any) {
    console.error(
      `Error reordering education items for section ${sectionId}:`,
      error
    );
    // Check for specific Prisma errors if needed, e.g., P2025 for record not found during update
    if (error.code === "P2025") {
      return NextResponse.json(
        {
          message: `One or more education items in the list not found or do not belong to section ${sectionId}.`,
        },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        message: `Error reordering education items for section ${sectionId}`,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
