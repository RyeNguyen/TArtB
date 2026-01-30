import { IconProps } from "../../types";

const RefreshIcon = ({ color = "#FFF", size = 24, ...props }: IconProps) => (
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
      d="M12.005 3c-.476 0-.93.048-1.362.113a.75.75 0 1 0 .225 1.483 7.6 7.6 0 0 1 1.137-.096c4.152 0 7.5 3.349 7.5 7.5s-3.348 7.5-7.5 7.5a7.49 7.49 0 0 1-7.5-7.5c0-1.967.764-3.74 2-5.075V8.75a.75.75 0 1 0 1.5 0v-3.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 1 0 0 1.5h1.553a8.96 8.96 0 0 0-2.303 6c0 4.962 4.039 9 9 9s9-4.038 9-9-4.038-9-9-9"
    />
  </svg>
);
export default RefreshIcon;
