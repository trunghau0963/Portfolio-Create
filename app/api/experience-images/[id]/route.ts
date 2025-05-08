import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// DELETE /api/experience-images/[id] - Delete an experience detail image
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) {
    return NextResponse.json(
      { message: "Missing experience detail image ID" },
      { status: 400 }
    );
  }

  try {
    await prisma.experienceDetailImage.delete({
      where: { id: id },
    });

    return NextResponse.json(
      { message: `Experience detail image ${id} deleted successfully` },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error deleting experience detail image ${id}:`, error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: `Experience detail image with ID ${id} not found` },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        message: `Error deleting experience detail image ${id}`,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
