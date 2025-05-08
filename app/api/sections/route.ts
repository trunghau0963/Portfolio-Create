import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const sections = await prisma.section.findMany({
      orderBy: {
        order: "asc",
      },
      include: {
        textBlocks: {
          orderBy: {
            order: "asc",
          },
        },
        imageBlocks: {
          orderBy: {
            order: "asc",
          },
        },
        heroContent: true,
        contactInfoItems: {
          orderBy: {
            order: "asc",
          },
        },
        customSectionContentBlocks: {
          orderBy: {
            order: "asc",
          },
        },
        educationItems: {
          orderBy: {
            order: "asc",
          },
          include: {
            images: { orderBy: { order: "asc" } },
          },
        },
        skillItems: {
          orderBy: { order: "asc" },
        },
        skillImages: {
          orderBy: { order: "asc" },
        },
        experienceItems: {
          orderBy: { order: "asc" },
          include: {
            detailImages: { orderBy: { order: "asc" } },
          },
        },
        projectItems: {
          orderBy: { order: "asc" },
        },
        testimonialItems: {
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(sections);
  } catch (error) {
    console.error("Error fetching sections:", error);
    return NextResponse.json(
      {
        message: "Error fetching sections",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, slug, type, order, visible } = body;

    // Basic validation
    if (!title || !slug || !type) {
      return NextResponse.json(
        { error: "Missing required fields: title, slug, type" },
        { status: 400 }
      );
    }

    // Check if slug is unique (optional, but good practice)
    const existingSectionBySlug = await prisma.section.findUnique({
      where: { slug },
    });
    if (existingSectionBySlug) {
      return NextResponse.json(
        { error: `Section with slug "${slug}" already exists` },
        { status: 409 } // Conflict
      );
    }

    const newSection = await prisma.section.create({
      data: {
        title,
        slug,
        type,
        order: typeof order === "number" ? order : 0, // Default order to 0 if not provided or invalid
        visible: typeof visible === "boolean" ? visible : true, // Default visible to true
        // Prisma will handle default empty relations for TextBlocks, ImageBlocks etc.
      },
    });

    return NextResponse.json(newSection, { status: 201 });
  } catch (error: any) {
    console.error("Error creating section:", error);
    // Handle potential Prisma validation errors or other specific errors
    if (error.code === "P2002") {
      // Unique constraint failed (e.g. if slug was not checked above but is unique)
      return NextResponse.json(
        {
          error: "A section with this identifier already exists.",
          field: error.meta?.target?.join(", "),
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create section", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  // This PUT on /api/sections is no longer the primary update mechanism.
  // Updates for specific sections should go to /api/sections/[id]
  // However, if you had a bulk update scenario for /api/sections, it could live here.
  // For now, returning Not Implemented or removing it is fine.
  return NextResponse.json(
    {
      message:
        "PUT on /api/sections is not the standard update method. Use PUT /api/sections/[id] instead.",
    },
    { status: 405 } // Method Not Allowed
  );
}
