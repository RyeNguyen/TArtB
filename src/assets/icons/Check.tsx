import { IconProps } from "../../types";

const CheckIcon = ({ color = "#FFF", size = 24, ...props }: IconProps) => (
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
      d="M21.737 4.497a.75.75 0 0 0-.515.226l-12.97 12.97-5.47-5.47a.75.75 0 1 0-1.06 1.06l6 6a.75.75 0 0 0 1.06 0l13.5-13.5a.75.75 0 0 0-.545-1.286"
    />
  </svg>
);
export default CheckIcon;
