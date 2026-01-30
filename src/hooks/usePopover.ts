import { useFloating, useInteractions } from "@floating-ui/react";
import React, { createContext, useContext } from "react";

export interface PopoverContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  refs: ReturnType<typeof useFloating>["refs"];
  floatingStyles: React.CSSProperties;
  getFloatingProps: ReturnType<typeof useInteractions>["getFloatingProps"];
  getReferenceProps: ReturnType<typeof useInteractions>["getReferenceProps"];
  transitionStyles: React.CSSProperties;
  isMounted: boolean;
  context: ReturnType<typeof useFloating>["context"];
}

export const PopoverContext = createContext<PopoverContextValue | null>(null);

export const usePopoverContext = () => {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error("Popover components must be used within a Popover");
  }
  return context;
};