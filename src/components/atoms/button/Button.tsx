import { Typography } from "@atoms/Typography";
import { COLORS } from "@constants/colors";
import { TypoVariants } from "@constants/common";
import { ButtonHTMLAttributes, CSSProperties, ElementType } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ElementType;
  iconSize?: number;
  iconColor?: string;
  isOutline?: boolean;
  isGhost?: boolean;
  text?: string;
  textStyle?: CSSProperties;
  textVariant?: TypoVariants;
  className?: string;
  textClassName?: string;
}

export const Button = ({
  icon: Icon,
  iconSize,
  iconColor = COLORS.GRAY_300,
  isOutline = false,
  isGhost = false,
  text,
  textStyle,
  textVariant,
  className,
  textClassName,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={`flex items-center justify-center border gap-2 rounded-2xl cursor-pointer transition-all duration-200
        hover:scale-105
        active:scale-95 bg-white border-transparent ${Icon && !text ? "p-1" : "px-2 py-0.5"} ${isOutline ? "bg-transparent! border-white!" : ""}
        ${isGhost ? "bg-transparent! hover:bg-white/40!" : ""} ${className}`}
      {...props}
    >
      {Icon && <Icon size={iconSize} color={iconColor} />}
      {text && (
        <Typography
          variant={textVariant}
          className={`${isOutline || isGhost ? "text-white!" : ""} ${textClassName}`}
          style={textStyle}
        >
          {text}
        </Typography>
      )}
    </button>
  );
};
