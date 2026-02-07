import { IconProps } from "../../types";

const DragListIcon = ({ color = "#FFF", size = 24, ...props }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    fill="none"
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      fill={color}
      d="M11.99 1.75a.75.75 0 0 0-.52.22l-2.5 2.5a.75.75 0 1 0 1.06 1.06L12 3.56l1.97 1.97a.75.75 0 1 0 1.06-1.06l-2.5-2.5a.75.75 0 0 0-.54-.22m-9.24 6a.75.75 0 1 0 0 1.5h18.5a.75.75 0 1 0 0-1.5zm0 3.5a.751.751 0 1 0 0 1.5h18.5a.751.751 0 1 0 0-1.5zm0 3.5a.751.751 0 1 0 0 1.5h18.5a.751.751 0 1 0 0-1.5zm11.743 3.49a.75.75 0 0 0-.523.23L12 20.44l-1.97-1.97a.75.75 0 1 0-1.06 1.06l2.5 2.5a.75.75 0 0 0 1.06 0l2.5-2.5a.75.75 0 0 0-.537-1.29"
    />
  </svg>
);

export default DragListIcon;
