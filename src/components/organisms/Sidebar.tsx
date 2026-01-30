import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useEffect, useRef, useState } from "react";
import { Glass } from "@atoms/Glass";
import { Typography } from "@atoms/Typography";
import { TypoVariants } from "@constants/common";
import { MenuCategories } from "@molecules/MenuCategories";
import ArtIcon from "@icons/Art";
import ClockIcon from "@icons/Clock";
import MoreIcon from "@icons/More";
import PlannerIcon from "@icons/Planner";
import { DynamicFieldRenderer } from "./DynamicFieldRenderer";
import {
  columnAnimationVariants,
  sidebarAnimationVariants,
} from "@animations/sideBar";

export interface MenuItemType {
  title: string;
  icon: ReactNode;
  iconActive: ReactNode;
}

const MENU_ITEMS: MenuItemType[] = [
  {
    title: "Artwork",
    icon: <ArtIcon />,
    iconActive: <ArtIcon color="#222" />,
  },
  {
    title: "Clock",
    icon: <ClockIcon />,
    iconActive: <ClockIcon color="#222" />,
  },
  {
    title: "Productivity",
    icon: <PlannerIcon />,
    iconActive: <PlannerIcon color="#222" />,
  },
  {
    title: "Other",
    icon: <MoreIcon />,
    iconActive: <MoreIcon color="#222" />,
  },
];

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
}

export const SettingsSidebar = ({
  isOpen,
  onClose,
  initialCategory,
}: SettingsSidebarProps) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [activeItem, setActiveItem] = useState<MenuItemType>(MENU_ITEMS[0]);

  useEffect(() => {
    const initItem = () => {
      if (isOpen && initialCategory) {
        const matchingItem = MENU_ITEMS.find(
          (item) => item.title === initialCategory,
        );
        if (matchingItem) {
          setActiveItem(matchingItem);
        }
      }
    };

    initItem();
  }, [isOpen, initialCategory]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <motion.div
            ref={sidebarRef}
            variants={sidebarAnimationVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="absolute flex top-0 right-0 h-full w-[45vw] pointer-events-auto"
          >
            <Glass className="h-full w-full items-start rounded-l-3xl">
              <div className="flex">
                <div className="flex px-3 py-6 gap-6 flex-col">
                  <div className="flex flex-col gap-1 pl-3">
                    <Typography variant={TypoVariants.TITLE_XL}>
                      TA<span className="text-primary-300">rt</span>B
                    </Typography>
                  </div>

                  <MenuCategories
                    data={MENU_ITEMS}
                    activeItem={activeItem}
                    onClickItem={setActiveItem}
                  />
                </div>

                <motion.div
                  variants={columnAnimationVariants}
                  className="h-screen z-10 flex-1 bg-gray-600 overflow-y-auto overflow-x-hidden"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeItem.title}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <DynamicFieldRenderer category={activeItem.title} />
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </div>
            </Glass>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
