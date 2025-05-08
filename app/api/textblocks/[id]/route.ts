import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Helper function to get ID from params
// function getIdFromRequest(request: Request): string | null {
//   const url = new URL(request.url);
//   const pathSegments = url.pathname.split("/");
//   // Assuming URL like /api/textblocks/{id}
//   const id = pathSegments[pathSegments.length - 1];
//   return id || null;
// }

// PUT /api/textblocks/[id] - Update a text block
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id) {
    return NextResponse.json(
      { message: "Missing text block ID" },
      { status: 400 }
    );
  }
  try {
    const body = await request.json();
    const { content } = body;

    if (content === undefined) {
      return NextResponse.json(
        { message: "Missing content field for update" },
        { status: 400 }
      );
    }

    const updatedItem = await prisma.textBlock.update({
      where: { id: id },
      data: { content: content },
    });
    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error(`Error updating text block ${id}:`, error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: "Text block not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: `Error updating text block ${id}`, error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/textblocks/[id] - Delete a text block
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id) {
    return NextResponse.json(
      { message: "Missing text block ID" },
      { status: 400 }
    );
  }
  try {
    await prisma.textBlock.delete({ where: { id: id } });
    return NextResponse.json(
      { message: "Text block deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error deleting text block ${id}:`, error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: "Text block not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: `Error deleting text block ${id}`, error: String(error) },
      { status: 500 }
    );
  }
}
