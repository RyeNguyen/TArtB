import { IconProps } from "../../types";

const ListIcon = ({ color = "#FFF", size = 24, ...props }: IconProps) => (
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
      d="M3.245 5.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5m3.5.5a.75.75 0 1 0 0 1.5h14.5a.75.75 0 1 0 0-1.5zm-3.5 4.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5m3.5.5a.751.751 0 1 0 0 1.5h14.5a.751.751 0 1 0 0-1.5zm-3.5 4.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5m3.5.5a.751.751 0 1 0 0 1.5h14.5a.751.751 0 1 0 0-1.5z"
    />
  </svg>
);
export default ListIcon;
