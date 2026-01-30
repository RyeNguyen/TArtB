import { useState } from "react";
import { motion } from "framer-motion";
import { Typography } from "@atoms/Typography";
import { ItemProps } from "@/types/common";

interface SelectorProps {
  id?: string;
  data: ItemProps[];
  defaultValue?: string;
  onChange?: (val: string) => void;
  activeClassname?: string;
  inactiveClassname?: string;
}

export const Selector = ({
  id,
  data,
  defaultValue,
  onChange,
  activeClassname = "",
  inactiveClassname = "",
}: SelectorProps) => {
  const [activeItem, setActiveItem] = useState<string>(
    defaultValue || data[0].value,
  );

  const handleChange = (item: ItemProps) => {
    setActiveItem(item.value);
    onChange?.(item.value);
  };

  return (
    <div className="flex bg-gray-300 rounded-2xl relative overflow-hidden">
      {data.map((item: ItemProps, index: number) => {
        const isActive = activeItem === item.value;

        return (
          <div
            key={item.value}
            className={`
              min-w-16
              w-auto
              relative
              px-3
              py-1.25
              text-sm
              font-medium
              items-center
              justify-center
              cursor-pointer
              transition-colors
              duration-300
              z-10
              ${inactiveClassname}
            `}
            onClick={() => handleChange(item)}
          >
            {isActive && (
              <motion.div
                layoutId={`selector-active-${id}`}
                className={`absolute inset-0 bg-primary-300! -z-10 ${index === 0 && "rounded-l-2xl"} ${index === data.length - 1 && "rounded-r-2xl"} ${activeClassname}`}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 35,
                }}
              />
            )}

            <Typography
              className={`${isActive ? "text-gray-500!" : "text-white"} text-center`}
            >
              {item.label}
            </Typography>
          </div>
        );
      })}
    </div>
  );
};
