import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  id: string;
}

// DELETE /api/skill-images/[id] - Delete a skill image
export async function DELETE(
  request: Request,
  { params }: { params: RouteParams }
) {
  const { id } = params;
  try {
    await prisma.skillImage.delete({
      where: { id: String(id) },
    });
    return NextResponse.json(
      { message: `Skill image ${id} deleted successfully.` },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting skill image ${id}:`, error);
    if ((error as any).code === "P2025") {
      // PrismaClientKnownRequestError: Record to delete not found.
      return NextResponse.json(
        { message: `Skill image with ID ${id} not found.` },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
