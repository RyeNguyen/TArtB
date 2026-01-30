import { useState } from "react";

interface SwitchProps {
  isDefaultActive?: boolean;
  onChange?: (val: boolean) => void;
  containerClassname?: string;
  childClassname?: string;
}

export const Switch = ({
  isDefaultActive = false,
  onChange,
  containerClassname = "",
  childClassname = "",
}: SwitchProps) => {
  const [isActive, setIsActive] = useState(isDefaultActive);

  const toggle = () => {
    const newState = !isActive;
    setIsActive(newState);
    if (onChange) onChange(newState);
  };

  return (
    <div
      onClick={toggle}
      className={`
        relative flex items-center cursor-pointer transition-colors duration-300
        w-11 h-6 p-1 rounded-full border
        ${isActive ? "bg-primary-300 border-transparent" : "bg-gray-300 border-primary-300"}
        ${containerClassname}
      `}
    >
      <div
        className={`
          w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out
          ${isActive ? "translate-x-5" : "translate-x-0"}
          ${!isActive && "bg-primary-300"} 
          ${childClassname}
        `}
      />
    </div>
  );
};
