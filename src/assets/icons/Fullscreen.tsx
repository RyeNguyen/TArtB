import { IconProps } from "../../types";

const CheckCircleIcon = ({ color = "#FFF", size = 24 }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="-0.8 -0.8 24 24"
    fill="none"
    stroke={color}
    stroke-linecap="round"
    stroke-linejoin="round"
    id="Arrows-Diagonal--Streamline-Tabler"
    height={size}
    width={size}
  >
    <path
      d="m14.933333333333334 3.7333333333333334 3.7333333333333334 0 0 3.7333333333333334"
      stroke-width="1.6"
    ></path>
    <path
      d="m13.066666666666666 9.333333333333334 5.6 -5.6"
      stroke-width="1.6"
    ></path>
    <path
      d="m7.466666666666667 18.666666666666668 -3.7333333333333334 0 0 -3.7333333333333334"
      stroke-width="1.6"
    ></path>
    <path
      d="m3.7333333333333334 18.666666666666668 5.6 -5.6"
      stroke-width="1.6"
    ></path>
  </svg>
);

export default CheckCircleIcon;
