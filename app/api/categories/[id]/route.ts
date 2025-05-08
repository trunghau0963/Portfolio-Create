import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  id: string;
}

// DELETE /api/categories/[id] - Delete a category
export async function DELETE(
  request: Request,
  { params }: { params: RouteParams }
) {
  const { id } = params;
  try {
    // Use a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // 1. Find all projects that use this category
      const projectsToUpdate = await tx.projectItem.findMany({
        where: {
          categoryIds: {
            has: id, // Check if the array contains the ID
          },
        },
        select: {
          id: true,
          categoryIds: true,
        },
      });

      // 2. Update each project to remove the category ID
      for (const project of projectsToUpdate) {
        await tx.projectItem.update({
          where: { id: project.id },
          data: {
            categoryIds: project.categoryIds.filter((catId) => catId !== id),
          },
        });
      }

      // 3. Delete the category itself
      await tx.category.delete({
        where: { id: String(id) },
      });
    });

    return NextResponse.json(
      {
        message: `Category ${id} deleted successfully and removed from projects.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting category ${id}:`, error);
    if ((error as any).code === "P2025") {
      // PrismaClientKnownRequestError: Record to delete not found.
      return NextResponse.json(
        { message: `Category with ID ${id} not found.` },
        { status: 404 }
      );
    }
    // Add more specific error handling for transaction failures if needed
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id] - Update a category (Optional - Placeholder)
// export async function PUT(request: Request, { params }: { params: RouteParams }) {
//   const { id } = params;
//   try {
//     const body = await request.json();
//     const { name } = body;
//     if (!name || typeof name !== 'string' || name.trim() === '') {
//       return NextResponse.json({ message: 'Category name is required.' }, { status: 400 });
//     }
//     // Add check for existing name if needed
//     const updatedCategory = await prisma.category.update({
//       where: { id: String(id) },
//       data: { name: name.trim() },
//     });
//     return NextResponse.json(updatedCategory);
//   } catch (error) {
//      console.error(`Error updating category ${id}:`, error);
//      if ((error as any).code === 'P2025') {
//        return NextResponse.json({ message: `Category with ID ${id} not found.` }, { status: 404 });
//      }
//      return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
//   }
// }
