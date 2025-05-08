import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// PUT /api/skills/reorder
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { orderedIds } = body;

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { message: "Invalid request body: orderedIds must be an array." },
        { status: 400 }
      );
    }

    // Use a transaction to update all orders atomically
    const updatePromises = orderedIds.map((id: string, index: number) =>
      prisma.skillItem.update({
        where: { id },
        data: { order: index },
      })
    );

    // Wait for all updates within the transaction
    await prisma.$transaction(updatePromises);

    return NextResponse.json(
      { message: "Skills reordered successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error reordering skills:", error);
    // Handle potential errors, e.g., if an ID is not found during the transaction
    if (error.code === "P2025") {
      return NextResponse.json(
        { message: "One or more skill items not found during reorder." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        message: "Error reordering skills",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
