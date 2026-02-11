import { IconProps } from "../../types";

const SearchIcon = ({ color = "#FFF", size = 24 }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="-0.8 -0.8 24 24"
    fill="none"
    stroke={color}
    stroke-linecap="round"
    stroke-linejoin="round"
    id="Search--Streamline-Tabler"
    height={size}
    width={size}
  >
    <path
      d="M2.8 9.333333333333334a6.533333333333333 6.533333333333333 0 1 0 13.066666666666666 0 6.533333333333333 6.533333333333333 0 1 0 -13.066666666666666 0"
      stroke-width="1.6"
    ></path>
    <path d="m19.6 19.6 -5.6 -5.6" stroke-width="1.6"></path>
  </svg>
);

export default SearchIcon;
