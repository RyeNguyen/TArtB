import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Typography } from "@atoms/Typography";
import { Button } from "@atoms/button/Button";
import { TypoVariants } from "@constants/common";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import ForbiddenIcon from "@icons/Forbidden";

interface ListFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (title: string, color: string) => void;
  mode: "add" | "edit";
  modalTitle?: string;
  initialTitle?: string;
  initialColor?: string;
}

const COLORS = [
  "transparent",
  "#4b1e1f", // red
  "#3c2b0f", // amber
  "#093E1E", // emerald
  "#072A46", // blue
  "#46216F", // violet
  "#0d5357", // teal
  "#293440",
  "#37383C",
];

export const ListFormModal = ({
  open,
  onOpenChange,
  onConfirm,
  mode,
  modalTitle,
  initialTitle = "",
  initialColor = COLORS[0],
}: ListFormModalProps) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(initialTitle);
  const [selectedColor, setSelectedColor] = useState(initialColor);

  useEffect(() => {
    const initState = () => {
      setTitle(initialTitle);
      setSelectedColor(initialColor || COLORS[0]);
    };

    if (open) {
      initState();
    }
  }, [open, initialTitle, initialColor]);

  const handleConfirm = () => {
    if (title.trim()) {
      onConfirm(title.trim(), selectedColor);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && title.trim()) {
      handleConfirm();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-100"
            onClick={handleCancel}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.04, 0.62, 0.23, 0.98] }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-101 w-[90%] max-w-md"
          >
            <div className="backdrop-blur-sm bg-gray-400/25 border border-white/10 rounded-2xl p-6 shadow-2xl">
              <Typography variant={TypoVariants.TITLE} className="mb-6">
                {modalTitle}
              </Typography>

              <div className="mb-6">
                <Typography className="text-text-color font-medium mb-2">
                  {t("toDo.list.name")}
                </Typography>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("toDo.list.namePlaceholder")}
                  className="w-full bg-white/20 rounded-2xl px-4 py-3 text-text-color font-light text-sz-default placeholder:text-text-color/50 outline-none transition-colors"
                  autoFocus
                />
              </div>

              <div className="mb-6">
                <Typography className="text-text-color font-medium mb-3">
                  {t("toDo.list.color")}
                </Typography>
                <div className="flex items-center gap-3 flex-wrap">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`h-6 flex-1 flex items-center justify-center cursor-pointer rounded-full transition-all hover:scale-110 ${
                        selectedColor === color
                          ? "ring-1 ring-primary-300 ring-offset-2 ring-offset-gray-400/25 scale-110"
                          : ""
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {color === "transparent" && <ForbiddenIcon size={28} />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  className="min-w-20"
                  isOutline
                  text={t("toDo.detail.deleteConfirm.cancel")}
                  onClick={handleCancel}
                />
                <Button
                  textClassName="text-gray-300!"
                  className="min-w-20 "
                  text={
                    mode === "add" ? t("toDo.list.add") : t("toDo.list.save")
                  }
                  disabled={!title.trim()}
                  onClick={handleConfirm}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
};
