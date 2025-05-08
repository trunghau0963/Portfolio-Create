import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST /api/projects - Create a new project item
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sectionId,
      title,
      description1,
      description2,
      imageSrc,
      layout,
      projectNumber,
      companyName,
      liveLink,
      sourceLink,
      categoryIds, // Expecting an array of category IDs
    } = body;

    if (!sectionId || !title) {
      return NextResponse.json(
        {
          message: "Missing required fields: sectionId and title are required.",
        },
        { status: 400 }
      );
    }

    const lastProject = await prisma.projectItem.findFirst({
      where: { sectionId: String(sectionId) },
      orderBy: { order: "desc" },
    });
    const newOrder = lastProject ? lastProject.order + 1 : 0;

    const newProject = await prisma.projectItem.create({
      data: {
        sectionId: String(sectionId),
        title: String(title),
        description1: description1 ? String(description1) : "",
        description2: description2 ? String(description2) : "",
        imageSrc: imageSrc ? String(imageSrc) : "",
        layout:
          layout === "layout1" || layout === "layout2" ? layout : "layout1",
        projectNumber: projectNumber ? String(projectNumber) : "",
        companyName: companyName ? String(companyName) : "",
        liveLink: liveLink ? String(liveLink) : "",
        sourceLink: sourceLink ? String(sourceLink) : "",
        order: newOrder,
        categoryIds: Array.isArray(categoryIds)
          ? categoryIds.filter((id) => typeof id === "string")
          : [],
      },
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Error creating project item:", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { message: "Invalid JSON in request body." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
