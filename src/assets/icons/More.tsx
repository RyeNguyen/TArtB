import { IconProps } from "../../types";

const MoreIcon = ({ color = "#FFF", size = 24 }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="-0.8 -0.8 24 24"
    fill="none"
    stroke={color}
    stroke-linecap="round"
    stroke-linejoin="round"
    id="Dots--Streamline-Tabler"
    height={size}
    width={size}
  >
    <path
      d="M3.7333333333333334 11.2a0.9333333333333333 0.9333333333333333 0 1 0 1.8666666666666667 0 0.9333333333333333 0.9333333333333333 0 1 0 -1.8666666666666667 0"
      stroke-width="1.6"
    ></path>
    <path
      d="M10.266666666666667 11.2a0.9333333333333333 0.9333333333333333 0 1 0 1.8666666666666667 0 0.9333333333333333 0.9333333333333333 0 1 0 -1.8666666666666667 0"
      stroke-width="1.6"
    ></path>
    <path
      d="M16.8 11.2a0.9333333333333333 0.9333333333333333 0 1 0 1.8666666666666667 0 0.9333333333333333 0.9333333333333333 0 1 0 -1.8666666666666667 0"
      stroke-width="1.6"
    ></path>
  </svg>
);
export default MoreIcon;
