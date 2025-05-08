"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tag, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ProjectCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  allCategories: string[];
  selectedCategories: string[];
  onSave: (projectId: string, categories: string[]) => void;
  onAddCategory: (category: string) => void;
}

export default function ProjectCategoryDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  allCategories,
  selectedCategories,
  onSave,
  onAddCategory,
}: ProjectCategoryDialogProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");

  // Initialize selected categories
  useEffect(() => {
    setCategories([...selectedCategories]);
  }, [selectedCategories, open]);

  const handleCategoryToggle = (category: string) => {
    if (categories.includes(category)) {
      setCategories(categories.filter((c) => c !== category));
    } else {
      setCategories([...categories, category]);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !allCategories.includes(newCategory.trim())) {
      onAddCategory(newCategory.trim());
      if (!categories.includes(newCategory.trim())) {
        setCategories([...categories, newCategory.trim()]);
      }
      setNewCategory("");
    }
  };

  const handleSave = () => {
    onSave(projectId, categories);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Project Categories</DialogTitle>
          <DialogDescription>
            Select categories for "{projectName}"
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Add new category */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="New category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAddCategory} disabled={!newCategory.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {/* Category list */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {allCategories.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No categories yet. Add your first category above.
              </p>
            ) : (
              allCategories.map((category) => (
                <div
                  key={category}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-md"
                >
                  <Checkbox
                    id={`category-${category}`}
                    checked={categories.includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                  />
                  <Label
                    htmlFor={`category-${category}`}
                    className="flex items-center text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    <Tag className="h-3 w-3 mr-2 text-gray-500" />
                    {category}
                  </Label>
                </div>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
