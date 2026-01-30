import React, { ReactNode, useState } from "react";

interface GlassProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export const Glass = ({
  children,
  className = "",
  style,
  ...props
}: GlassProps) => {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePosition({ x, y });
  };

  return (
    <div
      {...props}
      style={{
        willChange: "backdrop-filter",
        backfaceVisibility: "hidden",
        ...style,
      }}
      className={`
        relative
        rounded-2xl
        bg-gray-400/40
        backdrop-blur-xl
        shadow-2xl
        border
        border-white/10
        ${className}
      `}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="absolute inset-0 rounded-2xl transition-opacity duration-300 pointer-events-none -z-10"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,255,255,0.15) 0%, transparent 50%)`,
        }}
      />
      <div className="relative z-0">{children}</div>
    </div>
  );
};
