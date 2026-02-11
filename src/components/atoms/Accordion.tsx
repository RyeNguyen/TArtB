import { useState, createContext, useContext, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChevronIcon from "@icons/Chevron";

const AccordionContext = createContext<{
  closedIds: Set<string>;
  toggle: (id: string) => void;
  defaultOpen: boolean;
  type: "single" | "multiple";
} | null>(null);

interface AccordionProps {
  children: ReactNode;
  defaultOpen?: boolean;
  type?: "single" | "multiple";
  closedIds?: string[];
  onClosedIdsChange?: (closedIds: string[]) => void;
}

export const Accordion = ({
  children,
  defaultOpen = true,
  type = "multiple",
  closedIds: controlledClosedIds,
  onClosedIdsChange,
}: AccordionProps) => {
  // Support both controlled and uncontrolled mode
  const [internalClosedIds, setInternalClosedIds] = useState<Set<string>>(
    new Set(),
  );

  const isControlled = controlledClosedIds !== undefined;
  const closedIdsSet = isControlled
    ? new Set(controlledClosedIds)
    : internalClosedIds;

  const toggle = (id: string) => {
    const newSet = new Set(closedIdsSet);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      if (type === "single") {
        newSet.clear();
      }
      newSet.add(id);
    }

    if (isControlled && onClosedIdsChange) {
      onClosedIdsChange(Array.from(newSet));
    } else {
      setInternalClosedIds(newSet);
    }
  };

  return (
    <AccordionContext.Provider
      value={{ closedIds: closedIdsSet, toggle, defaultOpen, type }}
    >
      <div className="flex flex-col w-full">{children}</div>
    </AccordionContext.Provider>
  );
};

export const AccordionItem = ({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) => {
  return <div id={id}>{children}</div>;
};

export const AccordionTrigger = ({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) => {
  const context = useContext(AccordionContext);
  // Items are open by default unless they're in closedIds
  const isOpen = context ? !context.closedIds.has(id) : true;

  return (
    <button
      onClick={() => context?.toggle(id)}
      className="w-full flex items-center gap-2 group cursor-pointer"
    >
      <motion.div
        animate={{ rotate: isOpen ? 0 : -90 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <ChevronIcon />
      </motion.div>
      <div className="flex-1">{children}</div>
    </button>
  );
};

export const AccordionContent = ({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) => {
  const context = useContext(AccordionContext);
  // Items are open by default unless they're in closedIds
  const isOpen = context ? !context.closedIds.has(id) : true;

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
