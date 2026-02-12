import { IconProps } from "../../types";

const EditIcon = ({ color = "#FFF", size = 24 }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="-0.8 -0.8 24 24"
    fill="none"
    stroke={color}
    stroke-linecap="round"
    stroke-linejoin="round"
    id="Edit-Circle--Streamline-Tabler"
    height={size}
    width={size}
  >
    <path
      d="m11.2 14 7.826 -7.853999999999999a1.9600000000000002 1.9600000000000002 0 0 0 -2.7720000000000002 -2.7720000000000002L8.4 11.2v2.8h2.8z"
      stroke-width="1.6"
    ></path>
    <path
      d="m14.933333333333334 4.666666666666667 2.8 2.8"
      stroke-width="1.6"
    ></path>
    <path
      d="M8.4 6.598666666666667A6.533333333333333 6.533333333333333 0 0 0 9.333333333333334 19.6a6.533333333333333 6.533333333333333 0 0 0 6.467066666666667 -5.6"
      stroke-width="1.6"
    ></path>
  </svg>
);

export default EditIcon;
