import React, { ReactNode } from "react";
import { TypoVariants } from "../../constants/common";

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TypoVariants;
  className?: string;
  children?: ReactNode;
  isLoading?: boolean;
}

export const Typography = ({
  variant = TypoVariants.DEFAULT,
  children = "",
  className = "",
  isLoading = false,
  style,
}: TypographyProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case TypoVariants.TITLE_XL:
        return "font-bold text-5xl";
      case TypoVariants.TITLE:
        return "font-bold text-[32px]";
      case TypoVariants.SUBTITLE:
        return "font-medium text-[20px]";
      case TypoVariants.DEFAULT:
        return "font-light text-[18px]";
      case TypoVariants.DESCRIPTION:
        return "font-light text-[14px]";
      default:
        return "font-light text-[18px]";
    }
  };

  const variantStyles = getVariantStyles();

  if (isLoading) {
    return (
      <div
        className={`
          animate-pulse 
          bg-white/10 
          rounded-md 
          inline-block 
          min-w-30 
          h-8
          ${className}
        `}
      />
    );
  }

  return (
    <div
      className={`
        text-text-color
        ${variantStyles}
        ${className}
      `}
      style={style}
    >
      {children}
    </div>
  );
};
