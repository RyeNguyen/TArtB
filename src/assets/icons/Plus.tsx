import { IconProps } from "../../types";

const PlusIcon = ({ color = "#FFF", size = 24 }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="-0.8 -0.8 24 24"
    fill="none"
    stroke={color}
    stroke-linecap="round"
    stroke-linejoin="round"
    id="Square-Rounded-Plus--Streamline-Tabler"
    height={size}
    width={size}
  >
    <path
      d="M11.2 2.8c6.720000000000001 0 8.4 1.6800000000000002 8.4 8.4s-1.6800000000000002 8.4 -8.4 8.4 -8.4 -1.6800000000000002 -8.4 -8.4 1.6800000000000002 -8.4 8.4 -8.4z"
      stroke-width="1.6"
    ></path>
    <path d="M14 11.2H8.4" stroke-width="1.6"></path>
    <path d="M11.2 8.4v5.6" stroke-width="1.6"></path>
  </svg>
);
export default PlusIcon;
