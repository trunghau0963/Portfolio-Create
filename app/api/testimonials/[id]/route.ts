import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

interface RouteContext {
  params: {
    id: string;
  };
}

// PUT /api/testimonials/[id] - Update a testimonial
export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = params;
  try {
    const body = await request.json();
    const { clientName, role, company, content, rating, imageSrc, order } =
      body;

    const updateData: {
      clientName?: string;
      role?: string | null;
      company?: string | null;
      content?: string;
      rating?: number;
      imageSrc?: string | null;
      order?: number;
    } = {};

    if (clientName !== undefined) updateData.clientName = String(clientName);
    if (role !== undefined) updateData.role = role ? String(role) : null;
    if (company !== undefined)
      updateData.company = company ? String(company) : null;
    if (content !== undefined) updateData.content = String(content);
    if (rating !== undefined) {
      const parsedRating = Number(rating);
      if (!isNaN(parsedRating) && parsedRating >= 0 && parsedRating <= 5) {
        updateData.rating = parsedRating;
      } else {
        return NextResponse.json(
          {
            message: "Invalid rating value. Must be a number between 0 and 5.",
          },
          { status: 400 }
        );
      }
    }
    if (imageSrc !== undefined)
      updateData.imageSrc = imageSrc ? String(imageSrc) : null;
    if (order !== undefined) updateData.order = Number(order);

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No valid fields provided for update." },
        { status: 400 }
      );
    }

    const updatedTestimonial = await prisma.testimonialItem.update({
      where: { id: String(id) },
      data: updateData,
    });

    return NextResponse.json(updatedTestimonial);
  } catch (error) {
    console.error(`Error updating testimonial ${id}:`, error);
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
        { message: `Testimonial with ID ${id} not found.` },
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

// DELETE /api/testimonials/[id] - Delete a testimonial
export async function DELETE(request: Request, { params }: RouteContext) {
  const { id } = params;
  try {
    await prisma.testimonialItem.delete({
      where: { id: String(id) },
    });
    return NextResponse.json(
      { message: `Testimonial ${id} deleted successfully.` },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting testimonial ${id}:`, error);
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: `Testimonial with ID ${id} not found.` },
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
