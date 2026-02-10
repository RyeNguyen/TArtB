import React, {
  ReactNode,
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useCallback,
} from "react";
import {
  motion,
  PanInfo,
  useMotionValue,
  useSpring,
  useTransform,
  useDragControls,
} from "framer-motion";
import { Glass } from "@atoms/Glass";
import { useSettingsStore } from "@stores/settingsStore";
import { WidgetId } from "@constants/common";
import { WidgetPosition } from "../../types/settings";
import { WIDGET_REGISTRY } from "@constants/widgets";
import { useTranslation } from "react-i18next";
import { Typography } from "@atoms/Typography";

const DOCK_HEIGHT = 80;

interface WidgetWrapperProps {
  children: ReactNode;
  widgetId: WidgetId;
  defaultPosition?: { x: number; y: number };
  wrapperClassName?: string;
  innerGlassClassName?: string;
  onMinimize?: () => void;
  onClose?: () => void;
}

export const WidgetWrapper = ({
  children,
  widgetId,
  defaultPosition = { x: 16, y: 16 },
  wrapperClassName = "",
  innerGlassClassName = "",
  onMinimize,
  onClose,
}: WidgetWrapperProps) => {
  const { t } = useTranslation();
  const {
    settings,
    focusOrder,
    minimizeWidget,
    closeWidget,
    updateWidgetPosition,
    focusWidget,
    enterFocusMode,
    exitFocusMode,
  } = useSettingsStore();

  const widgetMeta = WIDGET_REGISTRY[widgetId];
  const widgetName = widgetMeta ? String(t(widgetMeta.name as any)) : "";
  const buttonsRef = useRef<HTMLDivElement>(null);
  const isFocused = settings.widgets[widgetId]?.focused || false;

  const [buttonsWidth, setButtonsWidth] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [5, -5]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-5, 5]);

  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  const storedPosition = settings.widgets[widgetId]?.position;
  const position = storedPosition || defaultPosition;

  const zIndex = 10 + focusOrder.indexOf(widgetId);

  useLayoutEffect(() => {
    if (buttonsRef.current) {
      setButtonsWidth(buttonsRef.current.offsetWidth);
    }
  }, []);

  // Clamp widget position when viewport is resized
  const clampToViewport = useCallback(() => {
    if (!wrapperRef.current) return;

    const rect = wrapperRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let newX = position.x;
    let newY = position.y;
    const headerVisibleMin = 50;
    const headerHeight = 24;

    // Clamp X: keep at least headerVisibleMin visible on screen
    if (position.x + rect.width < headerVisibleMin) {
      newX = headerVisibleMin - rect.width;
    } else if (position.x > viewportWidth - headerVisibleMin) {
      newX = viewportWidth - headerVisibleMin;
    }

    // Clamp Y: keep header visible and above dock
    if (position.y < 0) {
      newY = 0;
    } else if (position.y > viewportHeight - headerHeight - DOCK_HEIGHT) {
      newY = Math.max(0, viewportHeight - headerHeight - DOCK_HEIGHT);
    }

    if (newX !== position.x || newY !== position.y) {
      updateWidgetPosition(widgetId, { x: newX, y: newY });
    }
  }, [position, widgetId, updateWidgetPosition]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(clampToViewport, 100);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [clampToViewport]);

  // ESC key to exit focus mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFocused) {
        exitFocusMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocused, exitFocusMode]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();

    // Calculate normalized position (-0.5 to 0.5)
    const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
    const mouseY = (e.clientY - rect.top) / rect.height - 0.5;

    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMinimize) {
      onMinimize();
    } else {
      minimizeWidget(widgetId);
      // Note: Don't exit focus mode here - preserve focused state when minimizing
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClose) {
      onClose();
    } else {
      closeWidget(widgetId);
    }
  };

  const handleFocus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFocused) {
      exitFocusMode();
    } else {
      enterFocusMode(widgetId);
    }
  };

  const handleClick = () => {
    focusWidget(widgetId);
  };

  const handleDragStart = () => {
    setIsDragging(true);
    setTilt({ rotateX: 0, rotateY: 0 });
    focusWidget(widgetId);
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    setIsDragging(false);

    if (!wrapperRef.current) return;

    const rect = wrapperRef.current.getBoundingClientRect();
    const widgetWidth = rect.width;

    // Calculate new position: current CSS position + drag offset
    let newX = position.x + info.offset.x;
    let newY = position.y + info.offset.y;

    // Only constrain to keep header visible (at least 50px of header on screen)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const headerVisibleMin = 50;
    const headerHeight = 24; // Approximate header height

    // X: Allow going off-screen but keep some header visible
    newX = Math.max(-widgetWidth + headerVisibleMin, newX);
    newX = Math.min(viewportWidth - headerVisibleMin, newX);

    // Y: Keep header visible (top) and above dock (bottom)
    newY = Math.max(0, newY);
    newY = Math.min(viewportHeight - headerHeight - DOCK_HEIGHT, newY);

    // Reset the drag transform offset
    dragX.set(0);
    dragY.set(0);

    // Update stored position
    const newPosition: WidgetPosition = { x: newX, y: newY };
    updateWidgetPosition(widgetId, newPosition);
  };

  return (
    <motion.div
      ref={wrapperRef}
      className={`fixed ${wrapperClassName}`}
      drag={!isFocused}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        zIndex: isFocused ? 60 : zIndex,
        ...(isFocused
          ? {
              left: "50%",
              top: "46%",
              width: "95vw",
              height: "85vh",
              backfaceVisibility: "hidden",
            }
          : {
              perspective: isDragging ? "none" : 800,
              left: position.x,
              top: position.y,
              rotateX: isDragging ? 0 : rotateX,
              rotateY: isDragging ? 0 : rotateY,
              x: dragX,
              y: dragY,
              transformStyle: isDragging ? "flat" : "preserve-3d",
              willChange: isDragging ? "auto" : "transform",
              backfaceVisibility: "hidden",
            }),
      }}
      initial={false}
      animate={{
        x: isFocused ? "-50%" : 0,
        y: isFocused ? "-50%" : 0,
        scale: isFocused ? 1 : 1,
        opacity: isFocused ? 1 : 1,
        rotateX: isDragging || isFocused ? 0 : tilt.rotateX,
        rotateY: isDragging || isFocused ? 0 : tilt.rotateY,
      }}
      transition={{
        x: { duration: 0 }, // Instant position change
        y: { duration: 0 }, // Instant position change
        scale: { duration: 0.2, ease: "easeOut" },
        opacity: { duration: 0.15 },
        rotateX: { type: "spring", stiffness: 600, damping: 30 },
        rotateY: { type: "spring", stiffness: 600, damping: 30 },
      }}
    >
      <Glass
        className={`flex flex-col gap-0.5 ${isFocused ? "h-full" : "overflow-hidden"}`}
        style={{
          transform: "translateZ(0)",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
      >
        {/* Widget Header - Drag Handle */}
        <motion.div
          className="flex px-4 pt-2 items-center justify-between gap-2 z-10 cursor-grab active:cursor-grabbing"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div style={{ width: buttonsWidth }} />
          {widgetName && (
            <Typography className="text-white/60 text-xs uppercase tracking-wide select-none">
              {widgetName}
            </Typography>
          )}
          <div ref={buttonsRef} className="flex items-center gap-2">
            <div
              onClick={handleFocus}
              className="w-3.5 h-3.5 rounded-full bg-green-500 hover:bg-white/60 transition-colors cursor-pointer"
            />
            <div
              onClick={handleMinimize}
              className="w-3.5 h-3.5 rounded-full bg-amber-400 hover:bg-white/60 transition-colors cursor-pointer"
            />
            <div
              onClick={handleClose}
              className="w-3.5 h-3.5 rounded-full bg-red-400 hover:bg-white/60 transition-colors cursor-pointer"
            />
          </div>
        </motion.div>

        {/* Widget Body */}
        <div
          className={`rounded-2xl px-4 py-3 bg-transparent ${isFocused ? "flex-1 min-h-0" : "overflow-hidden"} ${innerGlassClassName}`}
          onWheel={(e) => {
            // Only stop propagation in normal mode
            // In focus mode, allow scrolling to work
            if (!isFocused) {
              e.stopPropagation();
            }
          }}
        >
          {children}
        </div>
      </Glass>
    </motion.div>
  );
};
