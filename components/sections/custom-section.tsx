"use client";
import { useAuth } from "@/context/auth-context";
import GridLayoutManager, {
  type ContentRow,
  type ContentItem,
  type ContentItemType,
} from "../ui/grid-layout-manager";
import EditableText from "@/components/ui/editable-text";
import EditableImage from "@/components/ui/editable-image";
import EditableTextAutoResize from "../ui/editable-text-auto-resize";
import {
  Section as PrismaSection,
  TextBlock as PrismaTextBlock,
  ImageBlock as PrismaImageBlock,
  CustomSectionContentBlock as PrismaCustomSectionContentBlock,
} from "../../lib/generated/prisma";
import AnimatedSection from "../ui/animated-section";
import { toast } from "sonner";
import React, { useMemo, useState, useCallback } from "react";
import { TextBlock } from '../blocks/TextBlock';
import { TitleBlock } from '../blocks/TitleBlock';
import { ImageBlock } from '../blocks/ImageBlock';
import type { ContentBlock } from '../../types/ContentBlock';

interface CustomSectionProps {
  section: PrismaSection & {
    textBlocks: PrismaTextBlock[];
    imageBlocks: PrismaImageBlock[];
    customSectionContentBlocks: PrismaCustomSectionContentBlock[];
  };
  onDataChange?: () => void;
}

export default function CustomSection({
  section,
  onDataChange,
}: CustomSectionProps) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;
  const sectionId = section.title;
  const introTextBlocks = section.textBlocks || [];
  const introImageBlocks = section.imageBlocks || [];
  const [isSavingLayout, setIsSavingLayout] = useState(false);

  const handleSaveTextBlock = async (blockId: string, newContent: string) => {
    try {
      const res = await fetch(`/api/textblocks/${blockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save text block");
      }
      toast.success("Text block saved!");
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error("Error saving text block:", error);
      toast.error(`Failed to save text: ${(error as Error).message}`);
    }
  };

  const handleSaveIntroImageBlock = async (
    blockId: string,
    newData: { src?: string; alt?: string; imagePublicId?: string | null }
  ) => {
    try {
      const res = await fetch(`/api/imageblocks/${blockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save intro image block");
      }
      toast.success("Intro image saved!");
      if (onDataChange) onDataChange();
    } catch (error) {
      console.error("Error saving intro image block:", error);
      toast.error(`Failed to save intro image: ${(error as Error).message}`);
    }
  };

  const handleSaveGridContentImage = async (
    blockContentId: string,
    imageData: { src: string; imagePublicId?: string; alt?: string }
  ) => {
    try {
      const res = await fetch(`/api/custom-section-content-blocks/${blockContentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageSrc: imageData.src,
          imageAlt: imageData.alt,
          imagePublicId: imageData.imagePublicId,
          type: "IMAGE",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save grid image content");
      }
      toast.success("Grid image content saved!");
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error("Error saving grid image content:", error);
      toast.error(`Failed to save grid image: ${(error as Error).message}`);
    }
  };

  // Hàm cập nhật bất kỳ thuộc tính nào của content block
  const handleUpdateGridContentBlock = async (
    blockContentId: string,
    updateData: Partial<{
      type: ContentItemType;
      content: string;
      imageSrc: string;
      imageAlt: string;
      imagePublicId: string;
      fontSize: number;
      fontWeight: string;
      fontStyle: string;
      textAlign: string;
      order: number;
    }>
  ) => {
    try {
      const res = await fetch(`/api/custom-section-content-blocks/${blockContentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update content block");
      }
      
      toast.success("Content updated successfully!");
      if (onDataChange) {
        onDataChange();
      }
      return true;
    } catch (error) {
      console.error("Error updating content block:", error);
      toast.error(`Failed to update content: ${(error as Error).message}`);
      return false;
    }
  };

  // Hàm xử lý khi layout thay đổi (thêm/sửa/xóa/sắp xếp lại các content blocks)
  const handleLayoutChange = useCallback(async (title: string, rows: ContentRow[]) => {
    // Tránh các lần gọi lại không cần thiết
    if (isSavingLayout) return;
    
    setIsSavingLayout(true);
    console.log("CustomSection: Layout changed, updating database...", rows);

    try {
      // 1. Chuyển đổi rows thành danh sách các content blocks cần cập nhật
      const contentBlockUpdates: Array<{
        id: string;
        order: number;
      }> = [];

      // Tạo một danh sách mới từ các rows, với order được tính lại
      const MAX_ITEMS_PER_ROW = 3;
      rows.forEach((row, rowIndex) => {
        row.items.forEach((item, itemIndex) => {
          // Tính order mới dựa trên vị trí trong grid
          const calculatedOrder = rowIndex * MAX_ITEMS_PER_ROW + itemIndex;
          
          // Chỉ cập nhật các block đã tồn tại trong database (có id không bắt đầu bằng kí tự ngẫu nhiên)
          if (item.id && !item.id.startsWith('row-')) {
            contentBlockUpdates.push({
              id: item.id,
              order: calculatedOrder,
            });
          }
        });
      });
      
      // 2. Cập nhật thứ tự vị trí của các blocks trong database
      if (contentBlockUpdates.length > 0) {
        // Sử dụng Promise.all để thực hiện các yêu cầu cập nhật đồng thời
        await Promise.all(
          contentBlockUpdates.map(async (update) => {
            const response = await fetch(`/api/custom-section-content-blocks/${update.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ order: update.order }),
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              console.error(`Failed to update block ${update.id} order:`, errorData);
              // Chúng ta không ném lỗi ở đây để tiếp tục với các cập nhật khác
            }
          })
        );
      }
      
      // 3. Thông báo với component cha rằng dữ liệu đã thay đổi (để refresh dữ liệu nếu cần)
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error("Error updating content block layout:", error);
      toast.error(`Failed to update layout: ${(error as Error).message}`);
    } finally {
      setIsSavingLayout(false);
    }
  }, [isSavingLayout, onDataChange]);

  // Thêm hàm xử lý cập nhật nội dung
  const handleContentUpdate = useCallback(async (blockId: string, newContent: string) => {
    try {
      const response = await fetch(`/api/custom-section-content-blocks/${blockId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update content");
      }

      // Gọi onDataChange sau khi cập nhật nội dung thành công
      if (onDataChange) {
        onDataChange();
      }
    } catch (error) {
      console.error("Error updating content:", error);
      toast.error(`Failed to update content: ${(error as Error).message}`);
    }
  }, [onDataChange]);

  // Function to transform PrismaCustomSectionContentBlock[] to ContentRow[]
  const transformContentBlocksToRows = (
    blocks: PrismaCustomSectionContentBlock[]
  ): ContentRow[] => {
    if (!blocks || blocks.length === 0) {
      return [];
    }

    // Sort blocks by their order first
    const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

    const rows: ContentRow[] = [];
    const MAX_ITEMS_PER_ROW = 3; // Consistent with GridLayoutManager logic

    for (let i = 0; i < sortedBlocks.length; i += MAX_ITEMS_PER_ROW) {
      const rowItemsPrisma = sortedBlocks.slice(i, i + MAX_ITEMS_PER_ROW);
      const contentItems: ContentItem[] = rowItemsPrisma.map(
        (block, itemIndex) => {
          // Chuẩn hóa type để đảm bảo tương thích với GridLayoutManager
          let normalizedType: ContentItemType = block.type.toLowerCase() as ContentItemType;
          
          // Đảm bảo type phải là một trong các giá trị hợp lệ ("title", "text", "image")
          if (!["title", "text", "image"].includes(normalizedType)) {
            // Nếu type không hợp lệ, mặc định là "text"
            normalizedType = "text";
          }
          
          // Xử lý đặc biệt cho kiểu IMAGE từ database
          const isImageType = block.type.toUpperCase() === "IMAGE";
          
          return {
            id: block.id,
            type: normalizedType,
            content: isImageType ? (block.imageSrc || "") : (block.content || ""),
            fontSize: block.fontSize || undefined,
            fontWeight: block.fontWeight || undefined,
            fontStyle: block.fontStyle || undefined,
            textAlign: block.textAlign as ContentItem["textAlign"] || undefined,
            alt: block.imageAlt || undefined,
            imagePublicId: block.imagePublicId || undefined,
          };
        }
      );

      rows.push({
        id: `row-${Math.floor(i / MAX_ITEMS_PER_ROW)}-${section.id}`, // Generate a stable row ID
        items: contentItems,
        position: Math.floor(i / MAX_ITEMS_PER_ROW),
      });
    }
    return rows;
  };

  // Memoize initialGridRows to prevent re-creation on every render unless dependencies change
  const initialGridRows = useMemo(() => {
    // console.log("CustomSection: Recalculating initialGridRows. customSectionContentBlocks:", section.customSectionContentBlocks);
    return transformContentBlocksToRows(
      section.customSectionContentBlocks || []
    );
  }, [section.customSectionContentBlocks]); // Dependency is section.customSectionContentBlocks

  // console.log(`CustomSection (${section.title}/${section.id}): Rendering with initialGridRows`, initialGridRows);

  const renderContentBlock = (block: ContentBlock) => {
    switch (block.type.toLowerCase()) {
      case 'text':
        return (
          <TextBlock
            key={block._id}
            content={block.content}
            fontSize={block.fontSize}
            fontWeight={block.fontWeight}
            fontStyle={block.fontStyle}
            textAlign={block.textAlign}
          />
        );
      case 'title':
        return (
          <TitleBlock
            key={block._id}
            content={block.content}
            fontSize={block.fontSize}
            fontWeight={block.fontWeight}
            fontStyle={block.fontStyle}
            textAlign={block.textAlign}
          />
        );
      case 'image':
        return (
          <ImageBlock
            key={block._id}
            src={block.imageSrc || block.content}
            alt={block.imageAlt || ''}
            linkUrl={block.linkUrl}
            publicId={block.imagePublicId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <section
      id={section.id}
      className="py-16 md:py-20 lg:py-24 bg-gray-100 dark:bg-gray-900"
    >
      <div className="max-w-6xl mx-auto px-4">
        <AnimatedSection variant="fadeInDown">
          <EditableTextAutoResize
            initialText={section.title || "Custom Section"}
            as="h1"
            className="text-center text-red-600 text-5xl sm:text-[80px] md:text-[100px] lg:text-[135px] font-bold leading-none tracking-tighter mb-8 md:mb-12"
          />
        </AnimatedSection>

        {introTextBlocks.length > 0 && (
          <AnimatedSection variant="fadeInUp" delay={0.1}>
            <div className="prose dark:prose-invert max-w-3xl mx-auto mb-8 text-center">
              {introTextBlocks.map((block) => (
                <EditableText
                  key={block.id}
                  initialText={block.content}
                  as="p"
                  blockId={block.id}
                  onCommitText={(newContent) => handleSaveTextBlock(block.id, newContent)}
                />
              ))}
            </div>
          </AnimatedSection>
        )}

        {introImageBlocks.length > 0 && (
          <AnimatedSection variant="fadeInUp" delay={0.2}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 md:mb-12">
              {introImageBlocks.map((block) => (
                <EditableImage
                  key={block.id}
                  src={block.src}
                  alt={block.alt || "Custom section image"}
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover rounded-md shadow-md"
                  onImageUploaded={(cloudinaryData) =>
                    handleSaveIntroImageBlock(block.id, {
                      src: cloudinaryData.secure_url,
                      imagePublicId: cloudinaryData.public_id,
                      alt: block.alt || "Custom section image",
                    })
                  }
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "portfolio_unsigned"}
                />
              ))}
            </div>
          </AnimatedSection>
        )}

        <GridLayoutManager
          sectionId={section.id}
          onGridImageSave={handleSaveGridContentImage}
          initialRows={initialGridRows}
          initialTitle={section.title}
          onLayoutChange={handleLayoutChange}
          onContentUpdate={handleContentUpdate}
        />
      </div>
    </section>
  );
}
