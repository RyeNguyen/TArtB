import { IconProps } from "@/types/common";

const DeleteIcon = ({ size = 24, color = "#FFF" }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-0.75 -0.75 24 24"
      fill="none"
      stroke={color}
      stroke-linecap="round"
      stroke-linejoin="round"
      id="Trash--Streamline-Tabler"
      height={size}
      width={size}
    >
      <path d="m3.75 6.5625 15 0" stroke-width="1.6"></path>
      <path d="m9.375 10.3125 0 5.625" stroke-width="1.6"></path>
      <path d="m13.125 10.3125 0 5.625" stroke-width="1.6"></path>
      <path
        d="m4.6875 6.5625 0.9375 11.25a1.675 1.675 0 0 0 1.675 1.675h7.5a1.675 1.675 0 0 0 1.675 -1.675l0.9375 -11.25"
        stroke-width="1.6"
      ></path>
      <path
        d="M8.4375 6.5625V3.75a0.9375 0.9375 0 0 1 0.9375 -0.9375h3.75a0.9375 0.9375 0 0 1 0.9375 0.9375v2.8125"
        stroke-width="1.6"
      ></path>
    </svg>
  );
};

export default DeleteIcon;
