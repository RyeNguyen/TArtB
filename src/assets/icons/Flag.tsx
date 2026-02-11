import { IconProps } from "../../types";

const FlagIcon = ({ color = "#FFF", size = 24 }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="-0.8 -0.8 24 24"
    fill="none"
    stroke={color}
    stroke-linecap="round"
    stroke-linejoin="round"
    id="Flag-3--Streamline-Tabler"
    height={size}
    width={size}
  >
    <path
      d="M4.666666666666667 13.066666666666666h13.066666666666666l-4.2 -4.2L17.733333333333334 4.666666666666667H4.666666666666667v14.933333333333334"
      stroke-width="1.6"
    ></path>
  </svg>
);
export default FlagIcon;
