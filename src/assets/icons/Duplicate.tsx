import { IconProps } from "@/types/common";

const DuplicateIcon = ({ size = 24, color = "#FFF" }: IconProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-0.75 -0.75 24 24"
      fill="none"
      stroke={color}
      stroke-linecap="round"
      stroke-linejoin="round"
      id="Copy--Streamline-Tabler"
      height={size}
      width={size}
    >
      <path
        d="M6.5625 9.0628125A2.5003124999999997 2.5003124999999997 0 0 1 9.0628125 6.5625h8.124375A2.5003124999999997 2.5003124999999997 0 0 1 19.6875 9.0628125v8.124375A2.5003124999999997 2.5003124999999997 0 0 1 17.1871875 19.6875H9.0628125A2.5003124999999997 2.5003124999999997 0 0 1 6.5625 17.1871875z"
        stroke={color}
        stroke-width="1.6"
      ></path>
      <path
        d="M3.7612499999999995 15.690937499999999A1.8796875 1.8796875 0 0 1 2.8125 14.0625V4.6875c0 -1.03125 0.84375 -1.875 1.875 -1.875h9.375c0.703125 0 1.0856249999999998 0.3609375 1.40625 0.9375"
        stroke-width="1.6"
      ></path>
    </svg>
  );
};

export default DuplicateIcon;
