import { IconProps } from "../../types";

const ChevronIcon = ({ color = "#FFF", size = 24, className }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="-0.8 -0.8 24 24"
    fill="none"
    stroke={color}
    stroke-linecap="round"
    stroke-linejoin="round"
    id="Chevron-Down--Streamline-Tabler"
    height={size}
    width={size}
    className={className}
  >
    <path d="m5.6 8.4 5.6 5.6 5.6 -5.6" stroke-width="1.6"></path>
  </svg>
);
export default ChevronIcon;
