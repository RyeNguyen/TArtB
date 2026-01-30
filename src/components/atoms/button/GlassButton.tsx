import { ReactNode, ButtonHTMLAttributes } from 'react';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  isIconButton?: boolean;
}

export const GlassButton = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  isIconButton = false,
  ...props
}: GlassButtonProps) => {
  const sizeClasses = {
    sm: `px-2 ${isIconButton ? "py-2" : "py-1.5"} text-sm`,
    md: `px-4 ${isIconButton ? "py-4" : "py-2"} text-base`,
    lg: 'px-6 py-3 text-lg',
  };

  const variantClasses = {
    primary: 'bg-gray-400/25 hover:bg-white/30',
    secondary: 'bg-white/10 hover:bg-white/20',
  };

  return (
    <button
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        backdrop-blur-sm
        rounded-2xl
        text-white
        font-medium
        transition-all duration-200
        hover:scale-105
        active:scale-95
        cursor-pointer
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};
