import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');
    
    // Tạo response headers để tắt cache
    const headers = new Headers({
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    
    // If sectionId is provided, filter blocks by section
    if (sectionId) {
      const blocks = await prisma.customSectionContentBlock.findMany({
        where: {
          sectionId: sectionId
        },
        orderBy: {
          order: 'asc'
        }
      });
      
      return NextResponse.json(blocks, { headers });
    } 
    
    // If no sectionId provided, return all blocks (with pagination if needed)
    const blocks = await prisma.customSectionContentBlock.findMany({
      orderBy: {
        order: 'asc'
      },
      // Optional: Add pagination here if this endpoint will return many blocks
      // take: 100,
    });
    
    return NextResponse.json(blocks, { headers });
    
  } catch (error: any) {
    console.error('Error fetching custom section content blocks:', error);
    
    // Add specific error handling for ObjectId format issues
    if (error.code === 'P2023') {
      return NextResponse.json({ 
        message: 'Invalid sectionId format. Expected a valid ObjectId.', 
        error: error.message 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      message: 'Failed to fetch custom section content blocks', 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let acquiredSectionId: string | undefined; // Added to hold sectionId for use in catch block
  try {
    const body = await request.json();
    const { 
      sectionId, // ID of the parent Section
      type,      // Type of the content block (e.g., "IMAGE", "TEXT")
      order,     // Order of the block within the section
      content,   // Initial content (optional)
      // Add any other fields that should be set on creation
      imageSrc,
      imageAlt,
      imagePublicId,
      fontSize,
      fontWeight,
      fontStyle,
      textAlign,
      linkUrl
    } = body;
    acquiredSectionId = sectionId; // Assign sectionId for potential use in catch block

    if (!sectionId || !type) {
      return NextResponse.json({ message: 'Missing required fields: sectionId and type' }, { status: 400 });
    }

    // Validate sectionId format if necessary (though Prisma might do this)
    // Basic validation for ObjectId length, though a regex might be better for full validation
    if (typeof sectionId !== 'string' || sectionId.length !== 24) {
        // console.warn(`Invalid sectionId format: ${sectionId}`);
        // Depending on strictness, you might want to return an error here
        // For now, we'll let Prisma handle deeper validation or potential errors.
    }

    // Kiểm tra xem block này đã tồn tại chưa (dựa trên type và content)
    // Đây là bước bổ sung để tránh tạo trùng lặp
    if (content) {
      const existingBlock = await prisma.customSectionContentBlock.findFirst({
        where: {
          sectionId: sectionId,
          type: type,
          content: content,
          ...(fontSize !== undefined && { fontSize: parseInt(String(fontSize), 10) }),
          ...(fontWeight !== undefined && { fontWeight: String(fontWeight) }),
        }
      });

      // Nếu block với cùng nội dung đã tồn tại, trả về block đó thay vì tạo mới
      if (existingBlock) {
        console.log(`Found existing block with same content for sectionId ${sectionId}, type ${type}, returning existing instead of creating new`);
        return NextResponse.json(existingBlock, { status: 200 });
      }
    }

    const createData: any = {
      section: { connect: { id: sectionId } },
      type,
      order: order !== undefined ? parseInt(String(order), 10) : 0, // Default order to 0 if not provided
      content: content !== undefined ? String(content) : null,
      imageSrc: imageSrc !== undefined ? String(imageSrc) : null,
      imageAlt: imageAlt !== undefined ? String(imageAlt) : null,
      imagePublicId: imagePublicId !== undefined ? String(imagePublicId) : null,
      linkUrl: linkUrl !== undefined ? String(linkUrl) : null,
    };
    
    if (fontSize !== undefined) createData.fontSize = parseInt(String(fontSize), 10);
    if (fontWeight !== undefined) createData.fontWeight = String(fontWeight);
    if (fontStyle !== undefined) createData.fontStyle = String(fontStyle);
    if (textAlign !== undefined) createData.textAlign = String(textAlign);

    const newBlock = await prisma.customSectionContentBlock.create({
      data: createData,
    });

    return NextResponse.json(newBlock, { status: 201 });
  } catch (error: any) {
    console.error('Error creating custom section content block:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('sectionId') && error.meta?.target?.includes('order')) {
      // Example: Unique constraint failed on sectionId and order
      return NextResponse.json({ message: 'A block with this order already exists in the section.', error: error.message }, { status: 409 }); // Conflict
    }
    if (error.code === 'P2025' || (error.name === 'PrismaClientKnownRequestError' && error.message.includes("Foreign key constraint failed"))) {
        // P2025: Record to connect to not found (e.g. sectionId does not exist)
        return NextResponse.json({ message: `Failed to create block: The specified section (ID: ${acquiredSectionId ?? 'unknown'}) was not found.`, error: error.message }, { status: 404 });
    }
    // Add more specific error handling as needed
    return NextResponse.json({ message: 'Failed to create custom section content block', error: error.message }, { status: 500 });
  }
} 