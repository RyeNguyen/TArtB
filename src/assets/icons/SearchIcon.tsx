import { IconProps } from "../../types";

const SearchIcon = ({ color = "#FFF", size = 24, ...props }: IconProps) => (
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
      d="M10.245 2.995c-3.996 0-7.25 3.254-7.25 7.25s3.254 7.25 7.25 7.25c1.728 0 3.316-.61 4.564-1.625l4.905 4.905a.75.75 0 1 0 1.06-1.06l-4.904-4.906a7.2 7.2 0 0 0 1.625-4.564c0-3.996-3.255-7.25-7.25-7.25m0 1.5a5.74 5.74 0 0 1 5.75 5.75 5.73 5.73 0 0 1-1.605 3.985.8.8 0 0 0-.16.16 5.73 5.73 0 0 1-3.985 1.605 5.74 5.74 0 0 1-5.75-5.75 5.74 5.74 0 0 1 5.75-5.75"
    />
  </svg>
);

export default SearchIcon;
