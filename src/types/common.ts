import type { ReactNode, SVGProps } from "react";

export interface IconProps extends SVGProps<SVGSVGElement> {
  color?: string;
  size?: number;
  className?: string;
}

export interface ItemProps {
  value: string;
  label: ReactNode;
  color?: string;
}
