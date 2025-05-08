import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// PUT /api/experience/[id] - Update an experience item
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json(
      { message: "Missing experience item ID" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    // Explicitly list fields allowed for update
    const {
      positionTitle,
      companyName,
      period,
      summary,
      description,
      imageSrc,
      // detailImages are handled by separate endpoints
      // order is handled by reorder endpoint
    } = body;

    const dataToUpdate: any = {};
    if (positionTitle !== undefined) dataToUpdate.positionTitle = positionTitle;
    if (companyName !== undefined) dataToUpdate.companyName = companyName;
    if (period !== undefined) dataToUpdate.period = period;
    if (summary !== undefined) dataToUpdate.summary = summary;
    if (description !== undefined) dataToUpdate.description = description;
    if (imageSrc !== undefined) dataToUpdate.imageSrc = imageSrc;

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { message: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    const updatedItem = await prisma.experienceItem.update({
      where: { id: id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error(`Error updating experience item ${id}:`, error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: `Experience item with ID ${id} not found` },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        message: `Error updating experience item ${id}`,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE /api/experience/[id] - Delete an experience item
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json(
      { message: "Missing experience item ID" },
      { status: 400 }
    );
  }

  try {
    // Important: Deleting an ExperienceItem might require deleting related
    // ExperienceDetailImage records first if onDelete: Cascade is not set
    // or doesn't work as expected with MongoDB relations.
    // For simplicity here, assume cascade delete works or relations are handled.
    await prisma.experienceDetailImage.deleteMany({
      where: { experienceItemId: id },
    });

    await prisma.experienceItem.delete({
      where: { id: id },
    });

    return NextResponse.json(
      { message: `Experience item ${id} deleted successfully` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error deleting experience item ${id}:`, error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: `Experience item with ID ${id} not found` },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        message: `Error deleting experience item ${id}`,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
