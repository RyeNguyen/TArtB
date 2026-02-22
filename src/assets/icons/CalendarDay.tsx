import { IconProps } from "../../types";

const CalendarDayIcon = ({ color = "#FFF", size = 24 }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="-0.8 -0.8 24 24"
    fill="none"
    stroke={color}
    stroke-linecap="round"
    stroke-linejoin="round"
    id="Calendar--Streamline-Tabler"
    height={size}
    width={size}
  >
    <path
      d="M3.7333333333333334 6.533333333333333a1.8666666666666667 1.8666666666666667 0 0 1 1.8666666666666667 -1.8666666666666667h11.2a1.8666666666666667 1.8666666666666667 0 0 1 1.8666666666666667 1.8666666666666667v11.2a1.8666666666666667 1.8666666666666667 0 0 1 -1.8666666666666667 1.8666666666666667H5.6a1.8666666666666667 1.8666666666666667 0 0 1 -1.8666666666666667 -1.8666666666666667V6.533333333333333z"
      stroke-width="1.6"
    ></path>
    <path
      d="M14.933333333333334 2.8v3.7333333333333334"
      stroke-width="1.6"
    ></path>
    <path
      d="M7.466666666666667 2.8v3.7333333333333334"
      stroke-width="1.6"
    ></path>
    <path
      d="M3.7333333333333334 10.266666666666667h14.933333333333334"
      stroke-width="1.6"
    ></path>
    <path
      d="M10.266666666666667 14h0.9333333333333333"
      stroke-width="1.6"
    ></path>
    <path d="M11.2 14v2.8" stroke-width="1.6"></path>
  </svg>
);
export default CalendarDayIcon;
