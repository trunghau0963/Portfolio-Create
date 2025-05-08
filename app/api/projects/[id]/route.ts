import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

interface RouteParams {
  id: string;
}

// PUT /api/projects/[id] - Update a project item
export async function PUT(
  request: Request,
  { params }: { params: RouteParams }
) {
  const { id } = params;
  try {
    const body = await request.json();

    // Explicitly list fields that can be updated for safety
    // Add other fields from ProjectItem model as needed
    const {
      title,
      description1,
      description2,
      imageSrc,
      imageAlt, // Include if added to schema, otherwise remove
      layout,
      projectNumber,
      companyName,
      liveLink,
      sourceLink,
      categoryIds, // Array of category IDs to connect/set
    } = body;

    // Type for updateData - adjust based on actual schema (nullable/required)
    type ProjectUpdateData = {
      title?: string;
      description1?: string;
      description2?: string;
      imageSrc?: string;
      imageAlt?: string; // Include if added to schema
      layout?: string;
      projectNumber?: string;
      companyName?: string;
      liveLink?: string;
      sourceLink?: string;
      categoryIds?: string[];
    };

    const updateData: ProjectUpdateData = {};

    if (title !== undefined) updateData.title = String(title);
    if (description1 !== undefined)
      updateData.description1 = String(description1);
    if (description2 !== undefined)
      updateData.description2 = String(description2);
    if (imageSrc !== undefined) updateData.imageSrc = String(imageSrc);
    // if (imageAlt !== undefined) updateData.imageAlt = String(imageAlt); // Include if added to schema
    if (layout !== undefined && (layout === "layout1" || layout === "layout2"))
      updateData.layout = layout;
    if (projectNumber !== undefined)
      updateData.projectNumber = String(projectNumber);
    if (companyName !== undefined) updateData.companyName = String(companyName);
    if (liveLink !== undefined) updateData.liveLink = String(liveLink);
    if (sourceLink !== undefined) updateData.sourceLink = String(sourceLink);
    if (categoryIds !== undefined && Array.isArray(categoryIds)) {
      updateData.categoryIds = categoryIds.filter(
        (catId) => typeof catId === "string"
      );
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No valid fields provided for update." },
        { status: 400 }
      );
    }

    const updatedProject = await prisma.projectItem.update({
      where: { id: String(id) },
      data: updateData, // Prisma handles partial updates
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error(`Error updating project item ${id}:`, error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON in request body." },
        { status: 400 }
      );
    }
    if (error instanceof PrismaClientKnownRequestError) {
      console.error("Prisma Error Code:", error.code);
      console.error("Prisma Error Meta:", error.meta);
      if (error.code === "P2025") {
        return NextResponse.json(
          {
            message: `Project item with ID ${id} not found.`,
            prismaCode: error.code,
          },
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          message: "Database error during update.",
          prismaCode: error.code,
          details: error.message,
        },
        { status: 500 }
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

// DELETE /api/projects/[id] - Delete a project item
export async function DELETE(
  request: Request,
  { params }: { params: RouteParams }
) {
  const { id } = params;
  try {
    await prisma.projectItem.delete({
      where: { id: String(id) },
    });
    return NextResponse.json(
      { message: `Project item ${id} deleted successfully.` },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting project item ${id}:`, error);
    if ((error as any).code === "P2025") {
      return NextResponse.json(
        { message: `Project item with ID ${id} not found.` },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
