import { IconProps } from "../../types";

const CloseIcon = ({ color = "#FFF", size = 24 }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="-0.8 -0.8 24 24"
    fill="none"
    stroke={color}
    stroke-linecap="round"
    stroke-linejoin="round"
    id="X--Streamline-Tabler"
    height={size}
    width={size}
  >
    <path d="M16.8 5.6 5.6 16.8" stroke-width="1.6"></path>
    <path d="m5.6 5.6 11.2 11.2" stroke-width="1.6"></path>
  </svg>
);

export default CloseIcon;
