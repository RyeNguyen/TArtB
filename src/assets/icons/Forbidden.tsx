import { IconProps } from "../../types";

const ForbiddenIcon = ({ color = "#FFF", size = 24 }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="-0.8 -0.8 24 24"
    fill="none"
    stroke={color}
    stroke-linecap="round"
    stroke-linejoin="round"
    id="Ban--Streamline-Tabler"
    height={size}
    width={size}
  >
    <path
      d="M2.8 11.2a8.4 8.4 0 1 0 16.8 0 8.4 8.4 0 1 0 -16.8 0"
      stroke-width="1.6"
    ></path>
    <path d="m5.32 5.32 11.76 11.76" stroke-width="1.6"></path>
  </svg>
);

export default ForbiddenIcon;
