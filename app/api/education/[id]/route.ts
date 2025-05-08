import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { EducationItem } from "@/lib/generated/prisma";

// Helper function to get ID from params (add error handling as needed)
function getIdFromRequest(request: Request): string | null {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split("/");
  // Assuming URL like /api/education/{id}
  const id = pathSegments[pathSegments.length - 1];
  return id || null;
}

// PUT /api/education/[id] - Update an education item
export async function PUT(request: Request) {
  const id = getIdFromRequest(request);
  if (!id) {
    return NextResponse.json(
      { message: "Missing education item ID" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    // Explicitly list fields allowed for update for security
    const { institution, period, description, degree } = body;

    const updateData: Partial<
      Pick<EducationItem, "institution" | "period" | "description" | "degree">
    > = {};
    if (institution !== undefined) updateData.institution = institution;
    if (period !== undefined) updateData.period = period;
    if (description !== undefined) updateData.description = description;
    if (degree !== undefined) updateData.degree = degree;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    const updatedItem = await prisma.educationItem.update({
      where: { id: id },
      data: updateData,
    });

    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error(`Error updating education item ${id}:`, error);
    if (error.code === "P2025") {
      // Prisma code for record not found
      return NextResponse.json(
        { message: "Education item not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        message: `Error updating education item ${id}`,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE /api/education/[id] - Delete an education item
export async function DELETE(request: Request) {
  const id = getIdFromRequest(request);
  if (!id) {
    return NextResponse.json(
      { message: "Missing education item ID" },
      { status: 400 }
    );
  }

  try {
    await prisma.educationItem.delete({
      where: { id: id },
    });
    // Note: Related EducationImages will also be deleted due to cascade if schema is set up
    return NextResponse.json(
      { message: "Education item deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error deleting education item ${id}:`, error);
    if (error.code === "P2025") {
      // Prisma code for record not found
      return NextResponse.json(
        { message: "Education item not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        message: `Error deleting education item ${id}`,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
