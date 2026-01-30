import { COLORS } from "@constants/colors";
import CheckIcon from "@icons/Check";

interface CheckboxProps {
  checked?: boolean;
  borderColor?: string;
  iconSize?: number;
  iconColor?: string;
  onClick?: () => void;
  className?: string;
}

export const Checkbox = ({
  checked = false,
  borderColor = COLORS.WHITE,
  iconSize = 16,
  iconColor = COLORS.GRAY_300,
  onClick,
  className,
}: CheckboxProps) => {
  return (
    <button
      className={`w-6 h-6 rounded-lg border flex items-center justify-center cursor-pointer ${
        checked ? "bg-primary-300" : ""
      } ${className}`}
      style={{
        borderColor: borderColor,
      }}
      onClick={onClick}
    >
      {checked && <CheckIcon size={iconSize} color={iconColor} />}
    </button>
  );
};
