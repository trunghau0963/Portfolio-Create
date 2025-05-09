import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Đảm bảo đường dẫn này đúng

interface RouteParams {
  id: string;
}

export async function PUT(
  request: Request,
  { params }: { params: RouteParams }
) {
  const blockId = params.id;

  if (!blockId) {
    return NextResponse.json({ message: 'Missing content block ID' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const {
      type,       // Loại của content block (IMAGE, TEXT, TITLE, etc.)
      content,    // Nội dung chính (text cho TEXT/TITLE, hoặc có thể là URL cho IMAGE nếu bạn muốn giữ logic đó)
      imageSrc,   // URL ảnh từ Cloudinary (quan trọng cho type IMAGE)
      imageAlt,   // Alt text cho ảnh
      imagePublicId, // ID công khai từ Cloudinary
      fontSize, // Giả sử fontSize có thể được gửi lên
      order,    // Giả sử order có thể được gửi lên
      // ... các trường khác có thể có trong body như fontSize, fontWeight, etc.
      ...otherData // Bắt các trường còn lại như fontSize, fontWeight, textAlign, etc.
    } = body;

    const updateData: any = { ...otherData }; // Khởi tạo với các trường khác

    // Đảm bảo các trường số được parse đúng cách nếu có
    if (fontSize !== undefined) {
      const parsedFontSize = parseInt(String(fontSize), 10);
      if (!isNaN(parsedFontSize)) {
        updateData.fontSize = parsedFontSize;
      } else {
        // Handle error or remove invalid fontSize from updateData
        delete updateData.fontSize; 
      }
    }
    if (order !== undefined) {
      const parsedOrder = parseInt(String(order), 10);
      if (!isNaN(parsedOrder)) {
        updateData.order = parsedOrder;
      } else {
        delete updateData.order;
      }
    }

    // Xử lý cập nhật dựa trên type
    if (type) { // Chỉ cập nhật type nếu nó được cung cấp
        updateData.type = type;
    }

    if (updateData.type === 'IMAGE') {
      // Nếu là IMAGE, ưu tiên imageSrc cho content và các trường liên quan đến ảnh
      updateData.content = imageSrc !== undefined ? imageSrc : content; // Cập nhật content bằng imageSrc nếu có
      updateData.imageSrc = imageSrc; // Luôn cập nhật imageSrc
      updateData.imageAlt = imageAlt !== undefined ? imageAlt : null;
      updateData.imagePublicId = imagePublicId !== undefined ? imagePublicId : null;
      // Các trường không liên quan đến ảnh có thể được giữ lại từ otherData hoặc xóa đi tùy logic
    } else if (updateData.type === 'TEXT' || updateData.type === 'TITLE') {
      updateData.content = content; // Cập nhật content cho text/title
      // Xóa các trường ảnh nếu type không phải là IMAGE để tránh lưu rác
      updateData.imageSrc = null;
      updateData.imageAlt = null;
      updateData.imagePublicId = null;
    } else if (content !== undefined) {
        // Nếu type không được định rõ hoặc không phải IMAGE/TEXT/TITLE nhưng có content
        updateData.content = content;
    }
    // Thêm các logic cập nhật khác cho các type khác nếu cần

    const updatedBlock = await prisma.customSectionContentBlock.update({
      where: { id: blockId },
      data: updateData,
    });

    return NextResponse.json(updatedBlock);
  } catch (error: any) {
    console.error(`Error updating custom section content block ${blockId}:`, error);
    // Check if the error is due to JSON parsing if the request body wasn't JSON
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      return NextResponse.json({ message: 'Invalid JSON in request body.', details: error.message }, { status: 400 });
    }
    // Add specific check for P2023 (Invalid ObjectId format)
    if (error.code === 'P2023') {
      return NextResponse.json({ message: `Invalid ID format for content block: '${blockId}'. Expected a valid ObjectId.`, error: error.message }, { status: 400 });
    }
    // Check for Prisma's record not found error
    if (error.code === 'P2025') { 
      return NextResponse.json({ message: `Content block with ID ${blockId} not found.` }, { status: 404 });
    }
    return NextResponse.json(
      { message: 'Failed to update custom section content block', error: error.message },
      { status: 500 }
    );
  }
} 