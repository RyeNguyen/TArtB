import { IconProps } from "../../types";

const SortIcon = ({ color = "#FFF", size = 24 }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="-0.8 -0.8 24 24"
    fill="none"
    stroke={color}
    stroke-linecap="round"
    stroke-linejoin="round"
    id="Sort-Ascending-Shapes--Streamline-Tabler"
    height={size}
    width={size}
  >
    <path d="m3.7333333333333334 14 2.8 2.8 2.8 -2.8" stroke-width="1.6"></path>
    <path d="M6.533333333333333 5.6v11.2" stroke-width="1.6"></path>
    <path
      d="M13.066666666666666 4.666666666666667a0.9333333333333333 0.9333333333333333 0 0 1 0.9333333333333333 -0.9333333333333333h3.7333333333333334a0.9333333333333333 0.9333333333333333 0 0 1 0.9333333333333333 0.9333333333333333v3.7333333333333334a0.9333333333333333 0.9333333333333333 0 0 1 -0.9333333333333333 0.9333333333333333h-3.7333333333333334a0.9333333333333333 0.9333333333333333 0 0 1 -0.9333333333333333 -0.9333333333333333V4.666666666666667z"
      stroke-width="1.6"
    ></path>
    <path
      d="m15.866666666666667 13.066666666666666 -3.2666666666666666 5.6h6.533333333333333z"
      stroke-width="1.6"
    ></path>
  </svg>
);
export default SortIcon;
