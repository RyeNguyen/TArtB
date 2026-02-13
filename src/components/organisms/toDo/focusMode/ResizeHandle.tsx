import { Separator } from "react-resizable-panels";
import { useState } from "react";

export const ResizeHandle = () => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <Separator
      className={`group relative w-px transition-all ${
        isDragging ? "bg-white/50" : "bg-white/20 hover:bg-white/25"
      }`}
      onPointerDown={() => setIsDragging(true)}
      onPointerUp={() => setIsDragging(false)}
      onPointerCancel={() => setIsDragging(false)}
    >
      <div className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize" />
    </Separator>
  );
};
