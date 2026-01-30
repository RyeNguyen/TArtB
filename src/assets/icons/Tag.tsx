import { IconProps } from "../../types";

const TagIcon = ({ color = "#FFF", size = 24, ...props }: IconProps) => (
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
      d="M13.997 2a3 3 0 0 0-2.12.879l-9 9a3.01 3.01 0 0 0 0 4.242l5 5a3 3 0 0 0 4.241 0l9-9a3 3 0 0 0 .88-2.122V4.5c0-1.372-1.129-2.5-2.5-2.5zm0 1.5h5.5c.559 0 1 .442 1 1v5.499c0 .406-.152.774-.44 1.061l-9 9a1.47 1.47 0 0 1-1.06.44 1.47 1.47 0 0 1-1.06-.44l-5-5a1.49 1.49 0 0 1 0-2.12l9-9c.287-.288.654-.44 1.06-.44m3 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3"
    />
  </svg>
);
export default TagIcon;
