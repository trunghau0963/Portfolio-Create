import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    await prisma.section.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting section:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete section", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    const updatedSection = await prisma.section.update({
      where: { id: id },
      data: {
        ...(typeof body.title !== "undefined" && { title: body.title }),
        ...(typeof body.slug !== "undefined" && { slug: body.slug }),
        ...(typeof body.type !== "undefined" && { type: body.type }),
        ...(typeof body.visible !== "undefined" && { visible: body.visible }),
        ...(typeof body.order !== "undefined" && { order: body.order }),
      },
    });

    return NextResponse.json(updatedSection);
  } catch (error: any) {
    console.error("Error updating section:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update section", details: error.message },
      { status: 500 }
    );
  }
}
