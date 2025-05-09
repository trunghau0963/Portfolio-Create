"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit, AlertCircle, MoveVertical } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/auth-context";
import EditableText from "./editable-text";
import EditableImage from "./editable-image";
import AnimatedSection from "./animated-section";
import { toast } from "sonner";

// Define content item types
export type ContentItemType = "title" | "text" | "image";

export interface ContentItem {
  id: string;
  type: ContentItemType;
  content: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  alt?: string;
  imagePublicId?: string;
}

export interface ContentRow {
  id: string;
  items: ContentItem[];
  position: number;
}

interface GridLayoutManagerProps {
  sectionId: string;
  initialTitle?: string;
  initialRows?: ContentRow[];
  onLayoutChange?: (title: string, rows: ContentRow[]) => void;
  onGridImageSave?: (itemId: string, imageData: { src: string; imagePublicId: string; alt?: string }) => Promise<void>;
  onContentUpdate?: (blockId: string, newContent: string) => Promise<void>;
}

const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "portfolio_unsigned"; // Define your preset

export default function GridLayoutManager({
  sectionId,
  initialTitle = "Section Title",
  initialRows = [],
  onLayoutChange,
  onGridImageSave,
  onContentUpdate,
}: GridLayoutManagerProps) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;

  // State for title and rows
  const [title, setTitle] = useState(initialTitle);
  const [rows, setRows] = useState<ContentRow[]>([]);

  // Dialog states
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [editItemDialogOpen, setEditItemDialogOpen] = useState(false);
  const [deleteRowDialogOpen, setDeleteRowDialogOpen] = useState(false);
  const [deleteItemDialogOpen, setDeleteItemDialogOpen] = useState(false);

  // Current item/row being edited or deleted
  const [currentRowIndex, setCurrentRowIndex] = useState<number | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null);
  const [itemToEdit, setItemToEdit] = useState<ContentItem | null>(null);
  const [rowToDelete, setRowToDelete] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{
    rowId: string;
    itemId: string;
  } | null>(null);

  // New item form state
  const [newItemType, setNewItemType] = useState<ContentItemType>("text");
  const [newItemContent, setNewItemContent] = useState("");
  const [newItemFontSize, setNewItemFontSize] = useState("16");
  const [newItemFontWeight, setNewItemFontWeight] = useState("normal");
  const [newItemFontStyle, setNewItemFontStyle] = useState("normal");
  const [newItemTextAlign, setNewItemTextAlign] = useState<
    "left" | "center" | "right" | "justify"
  >("left");

  // Edit item form state
  const [editItemContent, setEditItemContent] = useState("");
  const [editItemFontSize, setEditItemFontSize] = useState("16");
  const [editItemFontWeight, setEditItemFontWeight] = useState("normal");
  const [editItemFontStyle, setEditItemFontStyle] = useState("normal");
  const [editItemTextAlign, setEditItemTextAlign] = useState<
    "left" | "center" | "right" | "justify"
  >("left");

  const initialLoadComplete = useRef(false);

  // Utility function to persist a single item
  const persistCreatedItemUtil = async (
    itemCreationData: Omit<ContentItem, 'id'>,
    itemOrderInRow: number,
    owningRowPosition: number = 0
  ): Promise<ContentItem | null> => {
    const MAX_ITEMS_PER_ROW = 3; // Should be a constant or configurable
    const calculatedOrder = owningRowPosition * MAX_ITEMS_PER_ROW + itemOrderInRow;

    const apiPayload: any = {
      sectionId: sectionId, // Ensure sectionId is from props and valid
      type: itemCreationData.type,
      content: itemCreationData.content,
      order: calculatedOrder,
      fontSize: itemCreationData.fontSize,
      fontWeight: itemCreationData.fontWeight,
      fontStyle: itemCreationData.fontStyle,
      textAlign: itemCreationData.textAlign,
    };

    if (itemCreationData.type === "image") {
      apiPayload.imageSrc = itemCreationData.content; // For images, content is src
      apiPayload.imageAlt = itemCreationData.alt || `Default Alt Text for ${itemCreationData.type}`;
    }

    try {
      const response = await fetch("/api/custom-section-content-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to persist item via API:", errorData);
        toast.error(errorData.message || "Server error persisting item.");
        return null;
      }
      const createdBlock = await response.json();
      return {
        id: createdBlock.id,
        type: createdBlock.type as ContentItemType,
        content: createdBlock.type === 'IMAGE' ? (createdBlock.imageSrc || '') : (createdBlock.content || ''),
        fontSize: createdBlock.fontSize,
        fontWeight: createdBlock.fontWeight,
        fontStyle: createdBlock.fontStyle,
        textAlign: createdBlock.textAlign as ContentItem['textAlign'],
        alt: createdBlock.imageAlt || undefined, // Use server's alt or undefined
        imagePublicId: createdBlock.imagePublicId,
      };
    } catch (error) {
      console.error("Error in persistCreatedItemUtil:", error);
      toast.error(`Client-side error persisting item: ${(error as Error).message}`);
      return null;
    }
  };

  // Load layout from localStorage or initialize on component mount
  useEffect(() => {
    const initializeLayout = async () => {
      if (initialLoadComplete.current) return;

      // THÊM KHÓA TẠM THỜI ĐỂ NGĂN KHỞI TẠO ĐỒNG THỜI
      const initKey = `init-lock-${sectionId}`;
      // Kiểm tra xem có tiến trình khởi tạo đang chạy không
      const isInitializing = sessionStorage.getItem(initKey);
      if (isInitializing === 'true') {
        console.log(`GridLayoutManager: Another initialization for sectionId ${sectionId} is in progress. Waiting...`);
        // Đặt một timeout trước khi kiểm tra lại để tránh quá nhiều kiểm tra
        setTimeout(() => {
          initialLoadComplete.current = false; // Đảm bảo chúng ta có thể thử lại
          setRows([]); // Reset rows để kích hoạt useEffect một lần nữa
        }, 1000);
        return;
      }
      
      // Đặt khóa để chỉ ra rằng đang khởi tạo
      sessionStorage.setItem(initKey, 'true');
      
      try {
        // Prefer initialRows from props (DB) if available
        if (initialRows && initialRows.length > 0) {
          // console.log("GridLayoutManager: Initialized with initialRows from props.", initialRows);
          setRows(initialRows.sort((a: ContentRow, b: ContentRow) => a.position - b.position));
          setTitle(initialTitle); // Use initialTitle from props if rows are also from props
          initialLoadComplete.current = true;
          sessionStorage.removeItem(initKey); // Xóa khóa khi hoàn thành
          return;
        }

        // If no initialRows from props, try localStorage
        if (sectionId) {
          const savedLayout = localStorage.getItem(`layout-${sectionId}`);
          if (savedLayout) {
            try {
              const { title: savedTitle, rows: savedRows } = JSON.parse(savedLayout);
              if (savedRows && savedRows.length > 0) { // Ensure localStorage actually has rows
                setTitle(savedTitle || initialTitle);
                setRows(savedRows.sort((a: ContentRow, b: ContentRow) => a.position - b.position)); // Sort localStorage rows too
                initialLoadComplete.current = true;
                sessionStorage.removeItem(initKey); // Xóa khóa khi hoàn thành
                // console.log("GridLayoutManager: Initialized with localStorage data.");
                return;
              }
            } catch (error) {
              console.error("Error parsing saved layout from localStorage:", error);
              localStorage.removeItem(`layout-${sectionId}`);
            }
          }
        }

        // If no initialRows from DB AND no (or empty/invalid) localStorage, create default content
        // But ONLY if we're absolutely sure this is a completely new section with no content
        if (sectionId && !initialLoadComplete.current) { 
          // Add a check to verify if this section already has content in the database
          try {
            // Gửi request với timestamp để tránh cache
            const response = await fetch(`/api/custom-section-content-blocks?sectionId=${sectionId}&_=${Date.now()}`);
            if (response.ok) {
              const existingBlocks = await response.json();
              
              // If blocks already exist in the database, use them instead of creating defaults
              if (existingBlocks && existingBlocks.length > 0) {
                console.log(`GridLayoutManager: Found ${existingBlocks.length} existing blocks for sectionId ${sectionId}`);
                
                // Transform the existing blocks into rows
                const transformedRows = transformBlocksToRows(existingBlocks);
                setRows(transformedRows);
                initialLoadComplete.current = true;
                sessionStorage.removeItem(initKey); // Xóa khóa khi hoàn thành
                return;
              }
            }
          } catch (error) {
            console.error("Error checking for existing content blocks:", error);
          }
          
          console.log(`GridLayoutManager: No DB data or valid localStorage for sectionId ${sectionId}. Creating default content.`);
          
          // Kiểm tra lại một lần nữa trước khi tạo mặc định để đảm bảo không bị trùng lặp
          const doubleCheckResponse = await fetch(`/api/custom-section-content-blocks?sectionId=${sectionId}&_=${Date.now()}`);
          if (doubleCheckResponse.ok) {
            const doubleCheckBlocks = await doubleCheckResponse.json();
            if (doubleCheckBlocks && doubleCheckBlocks.length > 0) {
              console.log(`GridLayoutManager: Double-check found ${doubleCheckBlocks.length} blocks for sectionId ${sectionId}`);
              const transformedRows = transformBlocksToRows(doubleCheckBlocks);
              setRows(transformedRows);
              initialLoadComplete.current = true;
              sessionStorage.removeItem(initKey); // Xóa khóa khi hoàn thành
              return;
            }
          }
          
          setTitle(initialTitle); // Set title from prop
          const tempRowId = generateId();

          const defaultItemsData: Array<Omit<ContentItem, 'id'>> = [
            {
              type: "title",
              content: "Main Section Title", // More generic default
              fontSize: 32,
              fontWeight: "bold",
              textAlign: "center",
            },
            {
              type: "title",
              content: "Optional Subtitle", // More generic default
              fontSize: 24,
              fontWeight: "normal",
              textAlign: "center",
            },
          ];

          // Tạo một dấu hiệu trong localStorage để đánh dấu rằng đã bắt đầu khởi tạo
          localStorage.setItem(`default-items-initializing-${sectionId}`, 'true');

          const persistedItems: ContentItem[] = [];
          for (let i = 0; i < defaultItemsData.length; i++) {
            const itemData = defaultItemsData[i];
            const persisted = await persistCreatedItemUtil(itemData, i, 0);
            if (persisted) {
              persistedItems.push(persisted);
            } else {
              persistedItems.push({ ...itemData, id: generateId() }); 
            }
          }
          
          // Đánh dấu là đã hoàn thành khởi tạo
          localStorage.removeItem(`default-items-initializing-${sectionId}`);
          
          if (persistedItems.length > 0) { // Only set rows if we actually have items (persisted or fallback)
              const defaultRow: ContentRow = {
                id: tempRowId,
                items: persistedItems,
                position: 0,
              };
              setRows([defaultRow]);
              console.log("GridLayoutManager: Default content created and set.", [defaultRow]);
          } else {
              setRows([]); // Fallback to empty if even default creation failed badly
              console.warn("GridLayoutManager: Default content creation failed to produce items.");
          }
          initialLoadComplete.current = true;
        } else if (!initialLoadComplete.current) {
           setRows([]);
           setTitle(initialTitle);
           initialLoadComplete.current = true;
           console.log("GridLayoutManager: Initialized with empty rows due to missing sectionId or other issues.");
        }
      } finally {
        // Đảm bảo luôn xóa khóa bất kể kết quả là gì
        sessionStorage.removeItem(initKey);
      }
    };
    
    // Helper function to transform blocks to rows
    const transformBlocksToRows = (blocks: any[]): ContentRow[] => {
      const MAX_ITEMS_PER_ROW = 3;
      const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);
      const rows: ContentRow[] = [];
      
      for (let i = 0; i < sortedBlocks.length; i += MAX_ITEMS_PER_ROW) {
        const rowItems = sortedBlocks.slice(i, i + MAX_ITEMS_PER_ROW);
        const contentItems: ContentItem[] = rowItems.map(block => {
          // Chuẩn hóa type từ database để tương thích với UI
          let normalizedType: ContentItemType = block.type.toLowerCase() as ContentItemType;
          
          // Đảm bảo type là một trong các giá trị hợp lệ
          if (!["title", "text", "image"].includes(normalizedType)) {
            normalizedType = "text";
          }
          
          // Kiểm tra nếu là kiểu IMAGE (chữ hoa từ database)
          const isImageType = block.type.toUpperCase() === "IMAGE";
          
          return {
            id: block.id,
            type: normalizedType,
            content: isImageType ? (block.imageSrc || '') : (block.content || ''),
            fontSize: block.fontSize,
            fontWeight: block.fontWeight,
            fontStyle: block.fontStyle,
            textAlign: block.textAlign as ContentItem['textAlign'],
            alt: block.imageAlt || undefined,
            imagePublicId: block.imagePublicId,
          };
        });
        
        rows.push({
          id: `row-${Math.floor(i / MAX_ITEMS_PER_ROW)}-${sectionId}`,
          items: contentItems,
          position: Math.floor(i / MAX_ITEMS_PER_ROW),
        });
      }
      
      return rows;
    };

    // Reworked trigger logic for initializeLayout
    if (!initialLoadComplete.current) { // Only run if not yet completed
        if (initialRows && initialRows.length > 0) { // If initialRows from DB are ready, use them
            initializeLayout();
        } else if (sectionId) { // If no initialRows, but sectionId is present, proceed (for localStorage/default)
            initializeLayout();
        } else if (!sectionId && (!initialRows || initialRows.length === 0)) {
             // If no sectionId and no initialRows yet, wait or initialize empty
             // This state might occur if sectionId is loaded async and CustomSection renders GridLayoutManager before sectionId is ready.
             // Consider a loading state or only calling initializeLayout when sectionId is definitively available if it's essential for defaults.
             // For now, if it reaches here and hasn't loaded, it will try one more time, 
             // and if sectionId is still missing, it will init empty.
            initializeLayout(); 
        }
    }

  }, [sectionId, initialRows, initialTitle]); // Add initialTitle to deps for setting title correctly

  // Save layout to localStorage whenever it changes
  useEffect(() => {
    if (rows.length > 0) {
      // Use a ref to track if this is the initial load to prevent saving back what we just loaded
      const layoutString = JSON.stringify({ title, rows });
      const currentSaved = localStorage.getItem(`layout-${sectionId}`);

      // Only save if the layout has actually changed
      if (currentSaved !== layoutString) {
        localStorage.setItem(`layout-${sectionId}`, layoutString);
        if (onLayoutChange) {
          onLayoutChange(title, rows);
        }
      }
    }
  }, [title, rows, sectionId, onLayoutChange]);

  // Generate a unique ID
  const generateId = () => {
    return Math.random().toString(36).substring(2, 9);
  };

  // Add a new row
  const addRow = () => {
    const newRow: ContentRow = {
      id: generateId(),
      items: [],
      position: rows.length,
    };
    setRows([...rows, newRow]);
  };

  // Delete a row
  const deleteRow = async (rowId: string) => {
    // Tìm row cần xóa
    const rowToDeleteIndex = rows.findIndex((row) => row.id === rowId);
    if (rowToDeleteIndex === -1) {
      toast.error("Row not found for deletion.");
      return;
    }
    
    const rowItems = rows[rowToDeleteIndex].items;
    
    try {
      // Xóa tất cả các content block trong row từ database
      if (rowItems.length > 0) {
        // Tạo mảng các API calls để xóa các content block
        const deletePromises = rowItems.map(async (item) => {
          // Bỏ qua các item có ID tạm (không lưu trong database)
          if (item.id && !item.id.startsWith('row-')) {
            try {
              const response = await fetch(`/api/custom-section-content-blocks/${item.id}`, {
                method: "DELETE",
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                console.error(`Failed to delete content block ${item.id}:`, errorData);
                // Không ném lỗi để tiếp tục xóa các block khác
              }
            } catch (error) {
              console.error(`Error deleting content block ${item.id}:`, error);
              // Không ném lỗi để tiếp tục xóa các block khác
            }
          }
        });
        
        // Đợi tất cả các API call hoàn thành
        await Promise.all(deletePromises);
      }
      
      // Sau khi xóa xong từ database, cập nhật state trong UI
      const updatedRows = rows
        .filter((row) => row.id !== rowId)
        .map((row, index) => ({ ...row, position: index }));
        
      setRows(updatedRows);
      toast.success("Row and its content have been deleted successfully!");
      
      // Thông báo layout thay đổi
      if (onLayoutChange) {
        onLayoutChange(title, updatedRows);
      }
      
    } catch (error) {
      console.error("Error deleting row:", error);
      toast.error(`Failed to delete row: ${(error as Error).message}`);
    } finally {
      // Đóng dialog dù có lỗi hay không
      setDeleteRowDialogOpen(false);
      setRowToDelete(null);
    }
  };

  // Confirm delete row
  const confirmDeleteRow = (rowId: string) => {
    setRowToDelete(rowId);
    setDeleteRowDialogOpen(true);
  };

  // Move row up
  const moveRowUp = (rowId: string) => {
    const rowIndex = rows.findIndex((row) => row.id === rowId);
    if (rowIndex > 0) {
      const newRows = [...rows];
      const temp = newRows[rowIndex].position;
      newRows[rowIndex].position = newRows[rowIndex - 1].position;
      newRows[rowIndex - 1].position = temp;
      setRows(newRows.sort((a, b) => a.position - b.position));
    }
  };

  // Move row down
  const moveRowDown = (rowId: string) => {
    const rowIndex = rows.findIndex((row) => row.id === rowId);
    if (rowIndex < rows.length - 1) {
      const newRows = [...rows];
      const temp = newRows[rowIndex].position;
      newRows[rowIndex].position = newRows[rowIndex + 1].position;
      newRows[rowIndex + 1].position = temp;
      setRows(newRows.sort((a, b) => a.position - b.position));
    }
  };

  // Open add item dialog
  const openAddItemDialog = (rowIndex: number) => {
    setCurrentRowIndex(rowIndex);
    resetNewItemForm();
    setAddItemDialogOpen(true);
  };

  // Add a new item to a row
  const addItem = async () => {
    if (currentRowIndex === null) return;

    const targetRow = rows[currentRowIndex];

    // Check if we've reached the maximum of 3 items per row
    if (targetRow.items.length >= 3) {
      // TODO: Consider showing a toastr message to the user
      console.warn("Maximum 3 items per row reached.");
      setAddItemDialogOpen(false); // Close dialog as the action is implicitly cancelled
      return;
    }

    let itemContentValue = newItemContent;
    if (!itemContentValue) {
      switch (newItemType) {
        case "title":
          itemContentValue = "New Title";
          break;
        case "text":
          itemContentValue = "Add your text here. Click to edit.";
          break;
        case "image":
          itemContentValue = `https://picsum.photos/800/400?random=${Math.floor(
            Math.random() * 1000
          )}`;
          break;
        default:
          itemContentValue = "New content";
      }
    }

    const rowPosition = targetRow.position;
    const itemOrderInRow = targetRow.items.length;
    const MAX_ITEMS_PER_ROW = 3; // This should ideally be a shared constant or derived
    const calculatedOrder = rowPosition * MAX_ITEMS_PER_ROW + itemOrderInRow;

    // Chuyển đổi type từ UI sang định dạng database
    const databaseType = newItemType === "image" ? "IMAGE" : newItemType.toUpperCase();

    const apiPayload: any = {
      sectionId: sectionId, // from component props
      type: newItemType.toLowerCase(), // Normalize to lowercase
      content: itemContentValue,
      order: calculatedOrder,
      fontSize: Number.parseInt(newItemFontSize),
      fontWeight: newItemFontWeight,
      fontStyle: newItemFontStyle,
      textAlign: newItemTextAlign,
    };

    if (newItemType === "image") {
      apiPayload.imageSrc = itemContentValue; // For image type, content is the URL, also set imageSrc
    }

    try {
      const response = await fetch("/api/custom-section-content-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to create content block. Status: ${response.status}`
        );
      }

      const createdBlock = await response.json(); // This is the CustomSectionContentBlock from DB

      const newItemForState: ContentItem = {
        id: createdBlock.id, // Use ID from DB
        type: createdBlock.type as ContentItemType,
        content: createdBlock.type === 'IMAGE' ? (createdBlock.imageSrc || '') : (createdBlock.content || ''),
        fontSize: createdBlock.fontSize,
        fontWeight: createdBlock.fontWeight,
        fontStyle: createdBlock.fontStyle,
        textAlign: createdBlock.textAlign as ContentItem['textAlign'],
        alt: createdBlock.imageAlt || (newItemType === 'image' ? 'New image' : undefined),
        imagePublicId: createdBlock.imagePublicId,
      };

      const updatedRows = [...rows];
      updatedRows[currentRowIndex].items.push(newItemForState);
      setRows(updatedRows);
      setAddItemDialogOpen(false);
      resetNewItemForm();

      if (onLayoutChange) {
        onLayoutChange(title, updatedRows);
      }
      // TODO: Show success toast if available
      // toast.success("Content added successfully!");
    } catch (error) {
      console.error("Error adding item via API:", error);
      // TODO: Show error toast if available
      // toast.error(`Error: ${(error as Error).message}`);
      // Dialog remains open for user to retry or cancel.
    }
  };

  // Delete an item
  const deleteItem = async () => {
    if (!itemToDelete) {
      toast.error("No item selected for deletion.");
      return;
    }

    const { rowId: localRowId, itemId } = itemToDelete; // localRowId is for client-state row

    // Show loading state on button or UI if possible
    // setIsDeleting(true); // Assuming you have such a state

    try {
      const response = await fetch(`/api/custom-section-content-blocks/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete item. Status: ${response.status}`);
      }

      // If API call is successful, then update local state
      const updatedRows = rows.map((row) => {
        if (row.id === localRowId) {
          return {
            ...row,
            items: row.items.filter((item) => item.id !== itemId),
          };
        }
        return row;
      });

      // Remove any empty rows (except the first row if it's special, or adjust logic)
      // This logic might need review: what if user wants an empty row intentionally?
      // For now, keeping similar logic to before.
      const filteredRows = updatedRows
        .filter((row, index) => {
          // Keep the row if it's not empty OR if it's the only row left (even if empty)
          // or adjust based on whether a section can exist without any rows/items.
          // If a section must have at least one row, and one item, this needs more thought.
          // For now, let's allow a row to become empty. We can prevent deleting the last item of the last row if needed elsewhere.
          return true; // Simpler: just remove the item, don't auto-delete rows for now via this function. Row deletion is separate.
        })
         .map((row, index) => ({ ...row, position: index })); // Re-calculate positions if rows were deleted.

      // More precise update: only filter the specific row
      let finalRows = rows.map(row => {
        if (row.id === localRowId) {
          const newItems = row.items.filter(item => item.id !== itemId);
          // If this row becomes empty and it's not the only row, or some other condition,
          // it could be marked for deletion or handled by a separate "delete row" function.
          // For now, just update its items.
          return { ...row, items: newItems };
        }
        return row;
      });
      
      // Optionally, remove empty rows if that's desired behavior
      // finalRows = finalRows.filter(row => row.items.length > 0); 
      // Re-map positions if rows are removed
      // finalRows = finalRows.map((row, index) => ({ ...row, position: index }));


      setRows(finalRows);
      toast.success("Content item deleted successfully!");
      
      if (onLayoutChange) {
        onLayoutChange(title, finalRows); 
      }

    } catch (error) {
      console.error("Error deleting item via API:", error);
      toast.error(`Delete failed: ${(error as Error).message}`);
    } finally {
      // setIsDeleting(false);
      setDeleteItemDialogOpen(false); // Close dialog regardless of outcome for now
      setItemToDelete(null);
    }
  };

  // Confirm delete item
  const confirmDeleteItem = (rowId: string, itemId: string) => {
    setItemToDelete({ rowId, itemId });
    setDeleteItemDialogOpen(true);
  };

  // Open edit item dialog
  const openEditItemDialog = (rowIndex: number, itemIndex: number) => {
    const item = rows[rowIndex].items[itemIndex];
    setItemToEdit(item);
    setCurrentRowIndex(rowIndex);
    setCurrentItemIndex(itemIndex);
    setEditItemContent(item.content);
    setEditItemFontSize(item.fontSize?.toString() || "16");
    setEditItemFontWeight(item.fontWeight || "normal");
    setEditItemFontStyle(item.fontStyle || "normal");
    setEditItemTextAlign(item.textAlign || "left");
    setEditItemDialogOpen(true);
  };

  // Update item
  const updateItem = async () => {
    if (currentRowIndex === null || currentItemIndex === null || !itemToEdit) {
      toast.error("No item selected for editing or item data is missing.");
      return;
    }

    // Chuẩn hóa type cho database (chữ hoa)
    const databaseType = itemToEdit.type === "image" ? "IMAGE" : itemToEdit.type.toUpperCase();

    const apiPayload: any = {
      type: itemToEdit.type.toLowerCase(), // Normalize to lowercase
      content: editItemContent,
      // Only include styling if it's not an image type
      ...(itemToEdit.type !== "image" && {
        fontSize: Number.parseInt(editItemFontSize),
        fontWeight: editItemFontWeight,
        fontStyle: editItemFontStyle,
        textAlign: editItemTextAlign,
      }),
      // If it's an image, we might want to update alt text here if the dialog supports it
      // For now, imageSrc (content for image type) is handled by EditableImage and onGridImageSave
      // alt: itemToEdit.type === "image" ? editItemAlt : undefined, // Assuming editItemAlt exists in state
    };

    try {
      const response = await fetch(
        `/api/custom-section-content-blocks/${itemToEdit.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiPayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to update content block. Status: ${response.status}`
        );
      }

      const updatedBlockFromServer = await response.json();

      // Update local state with data from server to ensure consistency
      const updatedRows = rows.map((row, rIndex) => {
        if (rIndex === currentRowIndex) {
          return {
            ...row,
            items: row.items.map((item, iIndex) => {
              if (iIndex === currentItemIndex) {
                return {
                  ...item, // Spread existing item properties first
                  id: updatedBlockFromServer.id, // Ensure ID is from server
                  type: updatedBlockFromServer.type as ContentItemType,
                  content: updatedBlockFromServer.type === 'IMAGE' ? (updatedBlockFromServer.imageSrc || '') : (updatedBlockFromServer.content || ''),
                  fontSize: updatedBlockFromServer.fontSize,
                  fontWeight: updatedBlockFromServer.fontWeight,
                  fontStyle: updatedBlockFromServer.fontStyle,
                  textAlign: updatedBlockFromServer.textAlign as ContentItem['textAlign'],
                  alt: updatedBlockFromServer.imageAlt || item.alt, // Preserve existing alt or use from server
                  imagePublicId: updatedBlockFromServer.imagePublicId, // Use from server
                };
              }
              return item;
            }),
          };
        }
        return row;
      });

      setRows(updatedRows);
      toast.success("Content updated successfully!");

      setEditItemDialogOpen(false);
      setItemToEdit(null);
      setCurrentRowIndex(null);
      setCurrentItemIndex(null);

      if (onLayoutChange) {
        onLayoutChange(title, updatedRows);
      }
    } catch (error) {
      console.error("Error updating item via API:", error);
      toast.error(`Update failed: ${(error as Error).message}`);
      // Dialog can remain open for user to retry or cancel, or you can choose to close it.
    }
  };

  // Reset new item form
  const resetNewItemForm = () => {
    setNewItemType("text");
    setNewItemContent("");
    setNewItemFontSize("16");
    setNewItemFontWeight("normal");
    setNewItemFontStyle("normal");
    setNewItemTextAlign("left");
  };

  // Update item content directly (e.g., from EditableText)
  const updateItemContent = async (rowIndex: number, itemIndex: number, newContent: string) => {
    const itemToUpdate = rows[rowIndex]?.items[itemIndex];
    if (!itemToUpdate) {
      toast.error("Item not found for direct content update.");
      return;
    }

    // Optimistic UI update
    const updatedRowsOptimistic = rows.map((row, rIdx) => {
      if (rIdx === rowIndex) {
        return {
          ...row,
          items: row.items.map((item, iIdx) => {
            if (iIdx === itemIndex) {
              return { ...item, content: newContent };
            }
            return item;
          }),
        };
      }
      return row;
    });
    setRows(updatedRowsOptimistic);

    try {
      // Call onContentUpdate if provided
      if (onContentUpdate) {
        await onContentUpdate(itemToUpdate.id, newContent);
      } else {
        // Fallback to direct API call if onContentUpdate not provided
        const apiPayload = {
          content: newContent,
          type: itemToUpdate.type.toLowerCase(),
        };

        const response = await fetch(
          `/api/custom-section-content-blocks/${itemToUpdate.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(apiPayload),
          }
        );

        if (!response.ok) {
          setRows(rows); // Revert optimistic update
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update content");
        }
      }

      // Notify parent of layout change
      if (onLayoutChange) {
        onLayoutChange(title, updatedRowsOptimistic);
      }
    } catch (error) {
      console.error("Error saving content directly:", error);
      toast.error(`Save failed: ${(error as Error).message}`);
      setRows(rows); // Revert to original state on error
    }
  };

  // Get item style based on type and properties
  const getItemStyle = (item: ContentItem) => {
    const style: React.CSSProperties = {
      fontSize: `${item.fontSize || 16}px`,
      fontWeight: item.fontWeight || "normal",
      fontStyle: item.fontStyle || "normal",
      textAlign: item.textAlign || "left",
    };
    return style;
  };

  // Render content item based on type
  const renderContentItem = (
    item: ContentItem,
    rowIndex: number,
    itemIndex: number,
    itemsInRow: number
  ) => {
    const style = getItemStyle(item);

    // Calculate width based on number of items in the row
    const widthClass =
      itemsInRow === 1
        ? "w-full"
        : itemsInRow === 2
        ? "w-full md:w-1/2"
        : "w-full md:w-1/3";

    // Handler for when an image in the grid is successfully uploaded via EditableImage
    const handleGridItemImageUpload = async (itemId: string, cloudinaryData: { public_id: string; secure_url: string; }) => {
      if (onGridImageSave) {
        try {
          // Call the callback passed from CustomSection (which is handleSaveImageBlock)
          await onGridImageSave(itemId, { 
            src: cloudinaryData.secure_url, 
            imagePublicId: cloudinaryData.public_id, 
            // alt: item.alt // Alt is managed by the edit dialog for now, or could be passed if EditableImage returns it
          });
          
          // Optimistically update the local state for immediate UI feedback
          setRows(prevRows => 
            prevRows.map(row => ({
              ...row,
              items: row.items.map(i => 
                i.id === itemId 
                  ? { ...i, content: cloudinaryData.secure_url, imagePublicId: cloudinaryData.public_id } 
                  : i
              ),
            }))
          );
        } catch (error) {
          console.error("Error saving grid image item:", error);
          // Potentially show a toastr error message here
        }
      }
    };

    const content = (() => {
      switch (item.type) {
        case "title":
          return (
            <EditableText
              initialText={item.content}
              as="h2"
              className="font-bold tracking-tighter leading-tight"
              initialFontSize={item.fontSize}
              onCommitText={(newText) => updateItemContent(rowIndex, itemIndex, newText)}
              isLockButton={true}
            />
          );
        case "text":
          return (
            <EditableText
              initialText={item.content}
              as="p"
              className="mb-0"
              initialFontSize={item.fontSize} 
              onCommitText={(newText) => updateItemContent(rowIndex, itemIndex, newText)}
              isLockButton={true}
            />
          );
        case "image":
          return (
            <div className="rounded-lg overflow-hidden">
              <EditableImage
                src={item.content}
                alt={item.alt || "Content image"}
                width={800}
                height={400}
                className="w-full h-auto object-cover"
                uploadPreset={UPLOAD_PRESET}
                onImageUploaded={(cloudinaryData) => handleGridItemImageUpload(item.id, cloudinaryData)}
              />
            </div>
          );
        default:
          return null;
      }
    })();

    return (
      <div key={item.id} className={`p-2 ${widthClass}`}>
        <div className="relative group border border-transparent hover:border-gray-200 dark:hover:border-gray-700 rounded-lg p-3">
          {content}

          {isAdmin && (
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
              {item.type !== "image" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditItemDialog(rowIndex, itemIndex)}
                  className="h-8 w-8 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800"
                  title="Edit item"
                >
                  <Edit size={14} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => confirmDeleteItem(rows[rowIndex].id, item.id)}
                className="h-8 w-8 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 text-red-500 hover:text-red-700"
                title="Delete item"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid-layout-manager">
      {/* Render rows and items */}
      <div className="space-y-6">
        {rows
          .sort((a, b) => a.position - b.position)
          .map((row, rowIndex) => (
            <AnimatedSection
              key={row.id}
              delay={0.1 * rowIndex}
              variant="fadeInUp"
            >
              <div className="mb-6 relative">
                {/* Row content */}
                <div className="flex flex-wrap -mx-2">
                  {row.items.map((item, itemIndex) =>
                    renderContentItem(
                      item,
                      rowIndex,
                      itemIndex,
                      row.items.length
                    )
                  )}
                </div>

                {/* Add item button - only show if less than 3 items and admin */}
                {isAdmin && row.items.length < 3 && (
                  <div className="flex justify-center mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAddItemDialog(rowIndex)}
                      className="border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600 flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add Content
                    </Button>
                  </div>
                )}

                {/* Row controls - only visible to admin */}
                {isAdmin && rowIndex > 0 && (
                  <div className="absolute -top-3 right-0 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveRowUp(row.id)}
                      disabled={rowIndex === 0}
                      title="Move row up"
                      className="h-7 w-7 bg-white/80 dark:bg-gray-800/80"
                    >
                      <MoveVertical size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveRowDown(row.id)}
                      disabled={rowIndex === rows.length - 1}
                      title="Move row down"
                      className="h-7 w-7 bg-white/80 dark:bg-gray-800/80"
                    >
                      <MoveVertical
                        size={14}
                        className="transform rotate-180"
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => confirmDeleteRow(row.id)}
                      className="h-7 w-7 bg-white/80 dark:bg-gray-800/80 text-red-500 hover:text-red-700"
                      title="Delete row"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                )}
              </div>
            </AnimatedSection>
          ))}
      </div>

      {/* Add Row Button - Only visible to admin */}
      {isAdmin && rows.length < 4 && (
        <motion.div
          className="mt-8 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Button
            onClick={addRow}
            variant="outline"
            className="border-dashed border-gray-400 text-gray-600 hover:bg-gray-100 flex items-center gap-2"
          >
            <Plus size={16} />
            Add Row
          </Button>
        </motion.div>
      )}

      {/* Add Item Dialog */}
      <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Content
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-type">Content Type</Label>
              <Select
                value={newItemType}
                onValueChange={(value) =>
                  setNewItemType(value as ContentItemType)
                }
              >
                <SelectTrigger id="item-type">
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newItemType !== "image" ? (
              <div className="space-y-2">
                <Label htmlFor="item-content">Content</Label>
                <Textarea
                  id="item-content"
                  value={newItemContent}
                  onChange={(e) => setNewItemContent(e.target.value)}
                  placeholder={
                    newItemType === "title"
                      ? "Enter title text"
                      : "Enter paragraph text"
                  }
                  rows={4}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="item-content">Image URL</Label>
                <Input
                  id="item-content"
                  value={newItemContent}
                  onChange={(e) => setNewItemContent(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-gray-500">
                  Leave blank to use a placeholder image
                </p>
              </div>
            )}

            {newItemType !== "image" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="item-font-size">Font Size (px)</Label>
                  <Input
                    id="item-font-size"
                    type="number"
                    value={newItemFontSize}
                    onChange={(e) => setNewItemFontSize(e.target.value)}
                    min="8"
                    max="72"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="item-font-weight">Font Weight</Label>
                  <Select
                    value={newItemFontWeight}
                    onValueChange={(value) => setNewItemFontWeight(value)}
                  >
                    <SelectTrigger id="item-font-weight">
                      <SelectValue placeholder="Select font weight" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                      <SelectItem value="lighter">Light</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="item-font-style">Font Style</Label>
                  <Select
                    value={newItemFontStyle}
                    onValueChange={(value) => setNewItemFontStyle(value)}
                  >
                    <SelectTrigger id="item-font-style">
                      <SelectValue placeholder="Select font style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="italic">Italic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="item-text-align">Text Alignment</Label>
                  <Select
                    value={newItemTextAlign}
                    onValueChange={(value) =>
                      setNewItemTextAlign(
                        value as "left" | "center" | "right" | "justify"
                      )
                    }
                  >
                    <SelectTrigger id="item-text-align">
                      <SelectValue placeholder="Select text alignment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                      <SelectItem value="justify">Justify</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddItemDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={addItem}>Add Content</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={editItemDialogOpen} onOpenChange={setEditItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Content
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {itemToEdit?.type !== "image" ? (
              <div className="space-y-2">
                <Label htmlFor="edit-item-content">Content</Label>
                <Textarea
                  id="edit-item-content"
                  value={editItemContent}
                  onChange={(e) => setEditItemContent(e.target.value)}
                  rows={4}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="edit-item-content">Image URL</Label>
                <Input
                  id="edit-item-content"
                  value={editItemContent}
                  onChange={(e) => setEditItemContent(e.target.value)}
                />
              </div>
            )}

            {itemToEdit?.type !== "image" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-item-font-size">Font Size (px)</Label>
                  <Input
                    id="edit-item-font-size"
                    type="number"
                    value={editItemFontSize}
                    onChange={(e) => setEditItemFontSize(e.target.value)}
                    min="8"
                    max="72"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-item-font-weight">Font Weight</Label>
                  <Select
                    value={editItemFontWeight}
                    onValueChange={(value) => setEditItemFontWeight(value)}
                  >
                    <SelectTrigger id="edit-item-font-weight">
                      <SelectValue placeholder="Select font weight" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                      <SelectItem value="lighter">Light</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-item-font-style">Font Style</Label>
                  <Select
                    value={editItemFontStyle}
                    onValueChange={(value) => setEditItemFontStyle(value)}
                  >
                    <SelectTrigger id="edit-item-font-style">
                      <SelectValue placeholder="Select font style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="italic">Italic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-item-text-align">Text Alignment</Label>
                  <Select
                    value={editItemTextAlign}
                    onValueChange={(value) =>
                      setEditItemTextAlign(
                        value as "left" | "center" | "right" | "justify"
                      )
                    }
                  >
                    <SelectTrigger id="edit-item-text-align">
                      <SelectValue placeholder="Select text alignment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                      <SelectItem value="justify">Justify</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditItemDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={updateItem}>Update Content</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Row Confirmation Dialog */}
      <Dialog open={deleteRowDialogOpen} onOpenChange={setDeleteRowDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Confirm Row Deletion
            </DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete this row and all its content? This
            action cannot be undone.
          </p>
          <DialogFooter className="sm:justify-start mt-4">
            <Button
              variant="destructive"
              onClick={() => rowToDelete && deleteRow(rowToDelete)}
            >
              Delete
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteRowDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Item Confirmation Dialog */}
      <Dialog
        open={deleteItemDialogOpen}
        onOpenChange={setDeleteItemDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Confirm Content Deletion
            </DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete this content? This action cannot be
            undone.
          </p>
          <DialogFooter className="sm:justify-start mt-4">
            <Button variant="destructive" onClick={deleteItem}>
              Delete
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteItemDialogOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
