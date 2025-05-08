import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ImageBlock } from "@/lib/generated/prisma";

// Helper function to get ID from params
// function getIdFromRequest(request: Request): string | null {
//   const url = new URL(request.url);
//   const pathSegments = url.pathname.split("/");
//   // Assuming URL like /api/imageblocks/{id}
//   const id = pathSegments[pathSegments.length - 1];
//   return id || null;
// }

// PUT /api/imageblocks/[id] - Update an image block
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id) {
    return NextResponse.json(
      { message: "Missing image block ID" },
      { status: 400 }
    );
  }
  try {
    const body = await request.json();
    const { src, alt, caption } = body;

    // Build update data object selectively
    const updateData: Partial<Pick<ImageBlock, "src" | "alt" | "caption">> = {};
    if (src !== undefined) updateData.src = src;
    if (alt !== undefined) updateData.alt = alt;
    if (caption !== undefined) updateData.caption = caption;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No valid fields provided for update (src, alt, caption)" },
        { status: 400 }
      );
    }

    const updatedItem = await prisma.imageBlock.update({
      where: { id: id },
      data: updateData,
    });
    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error(`Error updating image block ${id}:`, error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: "Image block not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: `Error updating image block ${id}`, error: String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/imageblocks/[id] - Delete an image block
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  if (!id) {
    return NextResponse.json(
      { message: "Missing image block ID" },
      { status: 400 }
    );
  }
  try {
    await prisma.imageBlock.delete({ where: { id: id } });
    return NextResponse.json(
      { message: "Image block deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error(`Error deleting image block ${id}:`, error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: "Image block not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: `Error deleting image block ${id}`, error: String(error) },
      { status: 500 }
    );
  }
}
