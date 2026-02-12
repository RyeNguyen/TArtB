import React, { ReactNode, useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@atoms/Popover";
import { ItemProps } from "@/types/common";
import { Typography } from "@atoms/Typography";

interface DropdownProps {
  children: ReactNode;
  data: ItemProps[];
  value?: string | string[];
  header?: ReactNode;
  isCompact?: boolean;
  open?: boolean;
  multipleSelect?: boolean;
  onChange?: (value: string) => void;
  onOpenChange?: (open?: boolean) => void;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  menuItemClassName?: string;
}

export const Dropdown = ({
  children,
  data = [],
  value,
  header,
  isCompact = false,
  open: controlledOpen,
  multipleSelect = false,
  onChange,
  onOpenChange,
  className = "",
  triggerClassName = "",
  menuClassName = "",
  menuItemClassName = "",
}: DropdownProps) => {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const handleChange = (itemValue: string) => {
    onChange?.(itemValue);
    if (!multipleSelect) {
      if (isControlled) {
        onOpenChange?.(false);
      } else {
        setInternalOpen(false);
      }
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (isControlled) {
      onOpenChange?.(open);
    } else {
      setInternalOpen(open);
      onOpenChange?.(open);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <div className={`relative inline-flex ${className}`}>
        <PopoverTrigger className={triggerClassName}>{children}</PopoverTrigger>

        <PopoverContent className={`min-w-35 ${menuClassName}`}>
          {header && typeof header === "string" ? (
            <Typography className="px-2 py-1 mb-2 border-b border-white/20 uppercase text-text-color">
              {header}
            </Typography>
          ) : (
            header
          )}
          <div
            className={`flex ${isCompact ? "flex-row flex-wrap gap-2" : "flex-col"}`}
          >
            {data.map((item) => {
              const isActive = multipleSelect
                ? value?.includes(item.value)
                : value === item.value;

              return (
                <DropdownItem
                  key={item.value}
                  className={menuItemClassName}
                  isActive={isActive}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    item.onClick
                      ? item.onClick
                      : () => handleChange(item.value);
                  }}
                  data={item}
                />
              );
            })}
          </div>
        </PopoverContent>
      </div>
    </Popover>
  );
};

interface DropdownItemProps {
  data: ItemProps;
  onClick?: (e: React.MouseEvent) => void;
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
  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    onClick?.(e);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      className={`
        p-2 cursor-pointer rounded-xl
        transition-colors duration-150
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-white/20!"}
        ${isActive ? "bg-white/40" : ""}
        ${className}
      `}
      style={{
        backgroundColor: isActive ? data.color : "transparent",
      }}
    >
      {typeof data.label === "string" ? (
        <Typography
          className={`${data.color && isActive ? "text-gray-300!" : "text-text-color"}`}
        >
          {data.label}
        </Typography>
      ) : (
        data.label
      )}
    </div>
  );
};
