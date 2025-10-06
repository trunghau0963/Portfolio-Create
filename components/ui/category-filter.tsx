"use client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Tag } from "lucide-react";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onChange: (category: string | null) => void;
  showAllOption?: boolean;
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onChange,
  showAllOption = false,
}: CategoryFilterProps) {
  const effectiveSelected =
    selectedCategory === null && !showAllOption
      ? (categories[0] ?? null)
      : selectedCategory;

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {showAllOption && (
        <Button
          variant={selectedCategory === null ? "destructive" : "ghost"}
          size="sm"
          onClick={() => onChange(null)}
          className={`rounded-full ${
            selectedCategory === null
              ? " hover:bg-gray-100"
              : "border-white/50 text-white hover:bg-white/10"
          }`}
        >
          All
        </Button>
      )}

      {categories.map((category) => (
        <motion.div
          key={category}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant={effectiveSelected === category ? "destructive" : "ghost"}
            size="sm"
            onClick={() => onChange(category)}
            className={`rounded-full flex items-center gap-1  ${
              effectiveSelected === category
                ? " hover:bg-red-600"
                : "border-white/50 text-white hover:bg-white/10"
            }`}
          >
            <Tag className="h-3 w-3" />
            {category}
          </Button>
        </motion.div>
      ))}
    </div>
  );
}
