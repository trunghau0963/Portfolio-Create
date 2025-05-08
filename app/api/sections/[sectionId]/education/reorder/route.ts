import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Helper function to get sectionID from params
function getSectionIdFromRequest(request: Request): string | null {
  const url = new URL(request.url);
  // Assuming URL like /api/sections/{sectionId}/education/reorder
  const pathSegments = url.pathname.split("/");
  const sectionId = pathSegments[pathSegments.length - 3]; // Adjust index based on actual URL structure
  return sectionId || null;
}

// PUT /api/sections/[sectionId]/education/reorder
export async function PUT(request: Request) {
  const sectionId = getSectionIdFromRequest(request);
  if (!sectionId) {
    return NextResponse.json(
      { message: "Missing section ID" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { orderedIds } = body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { message: "Missing or invalid orderedIds array in request body" },
        { status: 400 }
      );
    }

    // Use Prisma transaction to update orders
    const updatePromises = orderedIds.map((id, index) =>
      prisma.educationItem.updateMany({
        where: {
          id: id,
          sectionId: sectionId, // Ensure we only update items belonging to the specified section
        },
        data: {
          order: index,
        },
      })
    );

    await prisma.$transaction(updatePromises);

    return NextResponse.json(
      { message: "Education items reordered successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      `Error reordering education items for section ${sectionId}:`,
      error
    );
    return NextResponse.json(
      {
        message: "Error reordering education items",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
