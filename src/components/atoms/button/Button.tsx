import { Typography } from "@atoms/Typography";
import { COLORS } from "@constants/colors";
import { TypoVariants } from "@constants/common";
import { ButtonHTMLAttributes, CSSProperties, ElementType } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ElementType;
  iconSize?: number;
  iconColor?: string;
  isOutline?: boolean;
  text?: string;
  textStyle?: CSSProperties;
  textVariant?: TypoVariants;
  className?: string;
  textClassName?: string;
}

export const Button = ({
  icon: Icon,
  iconSize = 24,
  iconColor = COLORS.GRAY_300,
  isOutline = false,
  text,
  textStyle,
  textVariant,
  className,
  textClassName,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={`flex items-center justify-center border gap-2 rounded-2xl cursor-pointer px-2 py-0.5 transition-all duration-200
        hover:scale-105
        active:scale-95 ${isOutline ? "bg-transparent border-white" : "bg-white border-transparent"} ${className}`}
      {...props}
    >
      {Icon && <Icon size={iconSize} color={iconColor} />}
      {text && (
        <Typography
          variant={textVariant}
          className={`${isOutline && "text-white!"} ${textClassName}`}
          style={textStyle}
        >
          {text}
        </Typography>
      )}
    </button>
  );
};
