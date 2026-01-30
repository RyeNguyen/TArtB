import { IconProps } from "../../types";

const SortIcon = ({ color = "#FFF", size = 24, ...props }: IconProps) => (
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
      d="M3.75 3a.75.75 0 1 0 0 1.5h9.5a.75.75 0 1 0 0-1.5zm12.988 3.74A.75.75 0 0 0 16 7.5v10.94l-2.22-2.22a.751.751 0 1 0-1.06 1.06l3.5 3.5a.75.75 0 0 0 1.06 0l3.5-3.5a.748.748 0 0 0-.236-1.235.75.75 0 0 0-.824.175l-2.22 2.22V7.5a.75.75 0 0 0-.762-.76M3.75 7a.75.75 0 1 0 0 1.5h7.5a.75.75 0 1 0 0-1.5zm0 4a.751.751 0 1 0 0 1.5h5.5a.75.75 0 1 0 0-1.5zm0 4a.751.751 0 1 0 0 1.5h3.5a.75.75 0 1 0 0-1.5zm0 4a.751.751 0 1 0 0 1.5h1.5a.751.751 0 1 0 0-1.5z"
    />
  </svg>
);
export default SortIcon;
