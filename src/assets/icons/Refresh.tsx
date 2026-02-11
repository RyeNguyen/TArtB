import { IconProps } from "../../types";

const RefreshIcon = ({ color = "#FFF", size = 24 }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="-0.8 -0.8 24 24"
    fill="none"
    stroke={color}
    stroke-linecap="round"
    stroke-linejoin="round"
    id="Refresh--Streamline-Tabler"
    height={size}
    width={size}
  >
    <path
      d="M18.666666666666668 10.266666666666667A7.56 7.56 0 0 0 4.2 8.4M3.7333333333333334 4.666666666666667v3.7333333333333334h3.7333333333333334"
      stroke-width="1.6"
    ></path>
    <path
      d="M3.7333333333333334 12.133333333333333a7.56 7.56 0 0 0 14.466666666666667 1.8666666666666667m0.4666666666666667 3.7333333333333334v-3.7333333333333334h-3.7333333333333334"
      stroke-width="1.6"
    ></path>
  </svg>
);
export default RefreshIcon;
