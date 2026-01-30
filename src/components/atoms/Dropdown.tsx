import React, { ReactNode, useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@atoms/Popover";
import { ItemProps } from "@/types/common";
import { Typography } from "@atoms/Typography";

interface DropdownProps {
  children: ReactNode;
  data: ItemProps[];
  value?: string;
  header?: string;
  onChange?: (value: string) => void;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  menuItemClassName?: string;
}

export const Dropdown = ({
  children,
  data = [],
  value,
  header = "",
  onChange,
  className = "",
  triggerClassName = "",
  menuClassName = "",
  menuItemClassName = "",
}: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (itemValue: string) => {
    onChange?.(itemValue);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <div className={`relative inline-flex ${className}`}>
        <PopoverTrigger className={triggerClassName}>{children}</PopoverTrigger>

        <PopoverContent className={`min-w-35 ${menuClassName}`}>
          {header && (
            <Typography className="px-2 py-1 mb-2 border-b border-white/20 uppercase text-text-color">
              {header}
            </Typography>
          )}
          {data.map((item) => (
            <DropdownItem
              key={item.value}
              className={menuItemClassName}
              isActive={item.value === value}
              onClick={() => handleChange(item.value)}
              data={item}
            />
          ))}
        </PopoverContent>
      </div>
    </Popover>
  );
};

interface DropdownItemProps {
  data: ItemProps;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
  disabled?: boolean;
}

export const DropdownItem = ({
  data,
  onClick,
  isActive,
  className = "",
  disabled = false,
}: DropdownItemProps) => {
  const handleClick = () => {
    if (disabled) return;
    onClick?.();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      className={`
        w-full p-2 cursor-pointer rounded-xl
        transition-colors duration-150
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-white/20"}
        ${isActive && "bg-white/40"}
        ${className}
      `}
    >
      {typeof data.label === "string" ? (
        <Typography className="text-white">{data.label}</Typography>
      ) : (
        data.label
      )}
    </div>
  );
};
