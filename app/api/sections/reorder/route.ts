import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Make sure this path is correct for your project

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { orderedIds } = body;

    if (!Array.isArray(orderedIds) || !orderedIds.every(id => typeof id === 'string')) {
      return NextResponse.json({ message: 'Invalid request body: orderedIds must be an array of strings.' }, { status: 400 });
    }

    // Use a transaction to update all section orders atomically
    const updatePromises = orderedIds.map((id: string, index: number) =>
      prisma.section.update({
        where: { id: id },
        data: { order: index },
      })
    );

    await prisma.$transaction(updatePromises);

    return NextResponse.json({ message: 'Sections reordered successfully.' }, { status: 200 });
  } catch (error: any) { // Changed 'error' to 'error: any' for broader error type handling
    console.error('Error reordering sections:', error);
    // Handle specific Prisma errors, e.g., P2025 for "Record to update not found"
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'One or more sections not found during reorder. Could not update.' }, { status: 404 });
    }
    // Handle other potential errors
    return NextResponse.json({ message: 'Internal Server Error reordering sections.', error: error.message }, { status: 500 });
  }
} 