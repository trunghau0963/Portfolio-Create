import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SkillItem } from "@/lib/generated/prisma";

// PUT /api/skills/[id] - Update a skill item
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id) {
    return NextResponse.json(
      { message: "Missing skill item ID" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    // Explicitly list fields allowed for update for security
    const { title, description, level, order } = body;

    // Validate data types (example for level)
    if (level !== undefined && typeof level !== "number") {
      return NextResponse.json(
        { message: "Invalid data type for level" },
        { status: 400 }
      );
    }
    if (order !== undefined && typeof order !== "number") {
      return NextResponse.json(
        { message: "Invalid data type for order" },
        { status: 400 }
      );
    }

    const updateData: Partial<
      Pick<SkillItem, "title" | "description" | "level" | "order">
    > = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (level !== undefined) updateData.level = level;
    if (order !== undefined) updateData.order = order;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    const updatedItem = await prisma.skillItem.update({
      where: { id: id },
      data: updateData,
    });

    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error(`Error updating skill item ${id}:`, error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: "Skill item not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        message: `Error updating skill item ${id}`,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE /api/skills/[id] - Delete a skill item
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id) {
    return NextResponse.json(
      { message: "Missing skill item ID" },
      { status: 400 }
    );
  }

  try {
    await prisma.skillItem.delete({
      where: { id: id },
    });
    return NextResponse.json(
      { message: "Skill item deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error deleting skill item ${id}:`, error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: "Skill item not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        message: `Error deleting skill item ${id}`,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
