import { ModalType } from "@constants/common";
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
  onClick?: () => void;
}

export type ModalState<T = any> =
  | { type: ModalType.NONE }
  | { type: ModalType.ADD; title: string }
  | { type: ModalType.EDIT; title: string; data: T }
  | { type: ModalType.DELETE; title: string; message: string; data: T }
  | { type: ModalType.DUPLICATE; title: string; message: string; data: T };
