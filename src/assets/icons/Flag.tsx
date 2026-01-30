import { IconProps } from "../../types";

const FlagIcon = ({ color = "#FFF", size = 24, ...props }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    {...props}
  >
    <path
      style={{
        scale: size === 16 ? "66.67%" : 1,
      }}
      fill={color}
      d="M3.75 2.495a.75.75 0 0 0-.75.75v17.5a.75.75 0 1 0 1.5 0v-4.75h15.75a.75.75 0 0 0 .6-1.2l-4.162-5.55 4.162-5.55a.75.75 0 0 0-.6-1.2zm.75 1.5h14.25l-3.6 4.8a.75.75 0 0 0 0 .9l3.6 4.8H4.5z"
    />
  </svg>
);
export default FlagIcon;
