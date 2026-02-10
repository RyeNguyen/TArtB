import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Glass } from "./Glass";
import { Typography } from "./Typography";
import { TypoVariants } from "@constants/common";
import { Button } from "@atoms/button/Button";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: "danger" | "default";
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  variant = "default",
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onOpenChange]);

  // Focus trap
  useEffect(() => {
    if (!open || !dialogRef.current) return;

    const focusableElements = dialogRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    // Focus first element
    firstElement?.focus();

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [open]);

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  if (!open) return null;

  const confirmButtonClass =
    variant === "danger"
      ? "min-w-20 bg-error-400! hover:bg-error-400/60! text-white"
      : "bg-white/20 hover:bg-white/30 text-white";

  return createPortal(
    <div
      className="fixed inset-0 z-200 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div ref={dialogRef} className="w-full max-w-md px-4">
        <Glass
          className="flex flex-col p-6"
          contentClassName="flex flex-col gap-2"
        >
          <Typography variant={TypoVariants.TITLE} className="text-white">
            {title}
          </Typography>

          <Typography className="text-white">{message}</Typography>

          <div className="flex gap-3 justify-end mt-2">
            <Button
              className="min-w-20"
              isOutline
              text={cancelText}
              onClick={handleCancel}
            />
            <Button
              className={confirmButtonClass}
              text={confirmText}
              onClick={handleConfirm}
            />
          </div>
        </Glass>
      </div>
    </div>,
    document.body,
  );
};
