import { motion } from "framer-motion";
import { Typography } from "../atoms/Typography";
import { MenuItemType } from "../organisms/Sidebar";

interface MenuCategoriesProps {
  data: MenuItemType[];
  activeItem: MenuItemType;
  onClickItem: (item: MenuItemType) => void;
}

export const MenuCategories = ({ data, activeItem, onClickItem }: MenuCategoriesProps) => {

  return (
    <div className="w-52.75 flex flex-col gap-1 relative">
      {data.map((item: MenuItemType) => {
        const isActive = item.title === activeItem.title;

        return (
          <div
            key={item.title}
            className="relative w-full items-center flex gap-2 p-2 cursor-pointer z-0"
            onClick={() => onClickItem(item)}
          >
            {isActive && (
              <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-primary-300 rounded-2xl -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}

            <div className="flex items-center gap-2 z-10">
              <motion.div animate={{ scale: isActive ? 1.1 : 1 }}>
                {isActive ? item.iconActive : item.icon}
              </motion.div>
              <Typography
                className={`transition-colors duration-300 ${isActive ? "text-gray-500!" : "text-white"}`}
              >
                {item.title}
              </Typography>
            </div>
          </div>
        );
      })}
    </div>
  );
};
