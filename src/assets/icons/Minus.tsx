import { IconProps } from "../../types";

const MinusIcon = ({ color = "#FFF", size = 24, ...props }: IconProps) => (
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
      d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2m0 1.5c4.703 0 8.5 3.797 8.5 8.5s-3.797 8.5-8.5 8.5A8.49 8.49 0 0 1 3.5 12c0-4.703 3.797-8.5 8.5-8.5m-4.25 7.75a.751.751 0 1 0 0 1.5h8.5a.751.751 0 1 0 0-1.5z"
    />
  </svg>
);
export default MinusIcon;
