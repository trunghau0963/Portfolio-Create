import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sectionId,
      clientName,
      role,
      company,
      content,
      rating,
      imageSrc,
      order = 0, // Default order if not provided
    } = body;

    if (!sectionId || !clientName || !content || rating === undefined) {
      return NextResponse.json(
        {
          message:
            "Missing required fields: sectionId, clientName, content, rating",
        },
        { status: 400 }
      );
    }

    if (typeof rating !== "number" || rating < 0 || rating > 5) {
      return NextResponse.json(
        { message: "Rating must be a number between 0 and 5." },
        { status: 400 }
      );
    }

    const newTestimonial = await prisma.testimonialItem.create({
      data: {
        sectionId: String(sectionId),
        clientName: String(clientName),
        role: role ? String(role) : null,
        company: company ? String(company) : null,
        content: String(content),
        rating: Number(rating),
        imageSrc: imageSrc ? String(imageSrc) : null,
        order: Number(order),
      },
    });

    return NextResponse.json(newTestimonial, { status: 201 });
  } catch (error) {
    console.error("Error creating testimonial:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    // Add more specific Prisma error handling if needed (e.g., foreign key constraint)
    return NextResponse.json(
      {
        message: "Internal Server Error",
        errorDetails: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
