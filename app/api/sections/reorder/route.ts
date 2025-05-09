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

    const MAX_RETRIES = 3;
    let retries = 0;
    let lastError: any = null;

    while (retries < MAX_RETRIES) {
      try {
        await prisma.$transaction(updatePromises);
        return NextResponse.json({ message: 'Sections reordered successfully.' }, { status: 200 });
      } catch (error: any) {
        lastError = error;
        if (error.code === 'P2034' && retries < MAX_RETRIES - 1) {
          retries++;
          console.warn(`Transaction failed with P2034, retrying... (Attempt ${retries}/${MAX_RETRIES})`);
          // Optional: add a small delay before retrying
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retries))); // Exponential backoff
        } else {
          // If not P2034 or max retries reached, break and handle error below
          break;
        }
      }
    }

    // If loop finished due to reaching max retries or other error, handle lastError
    console.error('Error reordering sections after retries:', lastError);
    
    if (lastError.code === 'P2034') {
      return NextResponse.json({ message: 'Transaction failed after multiple retries due to write conflict or deadlock.', error: lastError.message }, { status: 503 }); // Service Unavailable or Conflict
    }
    if (lastError.code === 'P2023') {
      return NextResponse.json({ message: 'Invalid ID format encountered during reorder. Could not update.', error: lastError.message }, { status: 400 });
    }
    if (lastError.code === 'P2025') {
      return NextResponse.json({ message: 'One or more sections not found during reorder. Could not update.', error: lastError.message }, { status: 404 });
    }
    return NextResponse.json({ message: 'Internal Server Error reordering sections.', error: lastError.message }, { status: 500 });
  } catch (error: any) { // Changed 'error' to 'error: any' for broader error type handling
    console.error('Error reordering sections:', error);
    
    if (error.code === 'P2023') {
      // P2023: Error parsing ObjectId value / Inconsistent column data
      return NextResponse.json({ message: 'Invalid ID format encountered during reorder. Could not update.', error: error.message }, { status: 400 });
    }
    if (error.code === 'P2025') {
      // P2025: Record to update/delete not found
      return NextResponse.json({ message: 'One or more sections not found during reorder. Could not update.', error: error.message }, { status: 404 });
    }
    // Handle other potential errors
    return NextResponse.json({ message: 'Internal Server Error reordering sections.', error: error.message }, { status: 500 });
  }
} 