import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  id: string;
}

// PUT /api/sections/[id]/projects/reorder - Reorder project items in a section
export async function PUT(
  request: Request,
  { params }: { params: RouteParams }
) {
  const { id } = params;
  try {
    const body = await request.json();
    const { orderedIds } = body;

    if (
      !Array.isArray(orderedIds) ||
      orderedIds.some((id) => typeof id !== "string")
    ) {
      return NextResponse.json(
        {
          message:
            "Invalid request body: orderedIds must be an array of strings.",
        },
        { status: 400 }
      );
    }

    // Use a transaction to update all project items in order
    const updatePromises = orderedIds.map((itemId, index) =>
      prisma.projectItem.update({
        where: { id: itemId, sectionId: id }, // Ensure project belongs to the section
        data: { order: index },
      })
    );

    await prisma.$transaction(updatePromises);

    return NextResponse.json({ message: "Projects reordered successfully." });
  } catch (error) {
    console.error(`Error reordering projects for section ${id}:`, error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON in request body." },
        { status: 400 }
      );
    }
    if ((error as any).code === "P2025") {
      // PrismaClientKnownRequestError: Record to update/delete not found
      return NextResponse.json(
        {
          message:
            "One or more project items not found or do not belong to the specified section.",
        },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
