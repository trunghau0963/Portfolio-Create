import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

interface RouteContext {
  params: {
    id: string;
  };
}

// PUT /api/contact-info/[id] - Update a contact info item
export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = params;
  try {
    const body = await request.json();
    const { type, value, label, order } = body;

    const updateData: {
      type?: string;
      value?: string;
      label?: string | null;
      order?: number;
    } = {};

    // Basic validation for type
    const allowedTypes = [
      "email",
      "phone",
      "linkedin",
      "github",
      "twitter",
      "facebook",
      "instagram",
      "website",
      "other",
    ];
    if (type !== undefined) {
      if (allowedTypes.includes(type)) {
        updateData.type = String(type);
      } else {
        return NextResponse.json(
          {
            message: `Invalid type provided. Allowed types are: ${allowedTypes.join(
              ", "
            )}`,
          },
          { status: 400 }
        );
      }
    }

    if (value !== undefined) updateData.value = String(value);
    if (label !== undefined) updateData.label = label ? String(label) : null;
    if (order !== undefined) updateData.order = Number(order);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No valid fields provided for update." },
        { status: 400 }
      );
    }

    const updatedItem = await prisma.contactInfoItem.update({
      where: { id: String(id) },
      data: updateData,
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error(`Error updating contact info ${id}:`, error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: `Contact info item with ID ${id} not found.` },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        message: "Internal Server Error",
        errorDetails: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// DELETE /api/contact-info/[id] - Delete a contact info item
export async function DELETE(request: Request, { params }: RouteContext) {
  const { id } = params;
  try {
    await prisma.contactInfoItem.delete({
      where: { id: String(id) },
    });
    return NextResponse.json(
      { message: `Contact info item ${id} deleted successfully.` },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting contact info ${id}:`, error);
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: `Contact info item with ID ${id} not found.` },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        message: "Internal Server Error",
        errorDetails: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
