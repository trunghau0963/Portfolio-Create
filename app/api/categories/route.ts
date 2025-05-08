import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/categories - Fetch all categories
export async function GET(request: Request) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc", // Optionally order categories by name
      },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      {
        message: "Error fetching categories",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create a new category
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        {
          message: "Category name is required and must be a non-empty string.",
        },
        { status: 400 }
      );
    }

    // Check if category already exists (case-insensitive check)
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: "insensitive", // Case-insensitive comparison
        },
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { message: `Category '${name.trim()}' already exists.` },
        { status: 409 }
      ); // 409 Conflict
    }

    const newCategory = await prisma.category.create({
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON in request body." },
        { status: 400 }
      );
    }
    // Handle potential unique constraint violation if race condition occurs despite check
    if ((error as any).code === "P2002") {
      return NextResponse.json(
        {
          message: `Category '${
            (error as any).meta?.target?.includes("name")
              ? JSON.parse((request.body as any) || "{}").name
              : "?"
          }' already exists.`,
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
