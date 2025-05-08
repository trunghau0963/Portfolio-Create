import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sectionId,
      type,
      value,
      label,
      order = 0, // Default order if not provided
    } = body;

    if (!sectionId || !type || !value) {
      return NextResponse.json(
        { message: "Missing required fields: sectionId, type, value" },
        { status: 400 }
      );
    }

    // Basic validation for type (adjust allowed types as needed)
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
    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        {
          message: `Invalid type provided. Allowed types are: ${allowedTypes.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    const newContactInfo = await prisma.contactInfoItem.create({
      data: {
        sectionId: String(sectionId),
        type: String(type),
        value: String(value),
        label: label ? String(label) : null,
        order: Number(order),
      },
    });

    return NextResponse.json(newContactInfo, { status: 201 });
  } catch (error) {
    console.error("Error creating contact info:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON in request body" },
        { status: 400 }
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
