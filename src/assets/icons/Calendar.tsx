import { IconProps } from "../../types";

const CalendarIcon = ({ color = "#FFF", size = 24, ...props }: IconProps) => (
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
      d="M6.25 3A3.26 3.26 0 0 0 3 6.25v11.5A3.26 3.26 0 0 0 6.25 21h11.5A3.26 3.26 0 0 0 21 17.75V6.25A3.26 3.26 0 0 0 17.75 3zm0 1.5h11.5c.975 0 1.75.775 1.75 1.75V7h-15v-.75c0-.975.775-1.75 1.75-1.75m-1.75 4h15v9.25a1.74 1.74 0 0 1-1.75 1.75H6.25a1.74 1.74 0 0 1-1.75-1.75zm3.25 2a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5m4.25 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5m4.25 0a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5M7.75 15a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5M12 15a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5"
    />
  </svg>
);
export default CalendarIcon;
