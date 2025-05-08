import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
