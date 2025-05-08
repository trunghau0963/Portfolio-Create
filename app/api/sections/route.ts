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
  return NextResponse.json(
    { message: "POST not implemented with Prisma yet" },
    { status: 501 }
  );
}

export async function PUT(request: Request) {
  return NextResponse.json(
    { message: "PUT not implemented with Prisma yet" },
    { status: 501 }
  );
}
