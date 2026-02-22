import { Typography } from "@atoms/Typography";
import { Dropdown } from "@atoms/Dropdown";
import DragListIcon from "@icons/DragList";
import MoreIcon from "@icons/More";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { fadeInOut } from "@animations/hover";
import { TaskList } from "@/types/toDo";
import React from "react";

interface SortableListItemProps {
  list: TaskList;
  isSelected: boolean;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
  onMoreClick: (e: React.MouseEvent) => void;
  getListActionData: (list: TaskList) => any[];
  openDropdownId: string | null;
  setOpenDropdownId: (id: string | null) => void;
}

export const SortableListItem = ({
  list,
  isSelected,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onMoreClick,
  getListActionData,
  openDropdownId,
  setOpenDropdownId,
}: SortableListItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: list.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`p-1 rounded-xl flex items-center justify-between gap-2 cursor-pointer hover:bg-white/10! ${isSelected ? "bg-white/20" : ""}`}
    >
      <div className="flex items-center gap-1 min-w-0 overflow-hidden">
        <motion.div
          initial="hidden"
          animate={isHovered ? "visible" : "hidden"}
          variants={fadeInOut}
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <DragListIcon />
        </motion.div>

        <Typography className="text-text-color truncate">
          {list.title}
        </Typography>
      </div>

      <div className="flex justify-center" onClick={onMoreClick}>
        <Dropdown
          data={getListActionData(list)}
          open={openDropdownId === list.id}
          onOpenChange={(open?: boolean) =>
            setOpenDropdownId(open ? list.id : null)
          }
        >
          <motion.div
            initial="hidden"
            animate={isHovered ? "visible" : "hidden"}
            variants={fadeInOut}
          >
            <MoreIcon />
          </motion.div>
        </Dropdown>
      </div>
    </div>
  );
};