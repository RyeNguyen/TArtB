import { IconProps } from "../../types";

const DragListIcon = ({ color = "#FFF", size = 24 }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="-0.8 -0.8 24 24"
    fill="none"
    stroke={color}
    stroke-linecap="round"
    stroke-linejoin="round"
    id="Arrows-Move-Vertical--Streamline-Tabler"
    height={size}
    width={size}
  >
    <path d="m8.4 16.8 2.8 2.8 2.8 -2.8" stroke-width="1.6"></path>
    <path d="M11.2 14v5.6" stroke-width="1.6"></path>
    <path d="m14 5.6 -2.8 -2.8 -2.8 2.8" stroke-width="1.6"></path>
    <path d="M11.2 2.8v5.6" stroke-width="1.6"></path>
  </svg>
);

export default DragListIcon;
