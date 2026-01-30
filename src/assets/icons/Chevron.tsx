import { IconProps } from "../../types";

const ChevronIcon = ({ color = "#FFF", size = 24, ...props }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    {...props}
  >
    <path
      style={{
        scale: size === 16 ? "66.67%" : 1,
      }}
      fill={color}
      d="M21.742 6.37a.75.75 0 0 0-.524.23l-9.22 9.22-9.22-9.22a.75.75 0 1 0-1.06 1.06l9.75 9.75a.75.75 0 0 0 1.06 0l9.75-9.75a.75.75 0 0 0-.536-1.29"
    />
  </svg>
);
export default ChevronIcon;
