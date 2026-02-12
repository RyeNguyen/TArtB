import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import confetti from "canvas-confetti";

export interface ConfettiHandle {
  fire: (x?: number, y?: number) => void;
}

interface ConfettiProps {
  className?: string;
}

export const Confetti = forwardRef<ConfettiHandle, ConfettiProps>(
  ({ className = "" }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useImperativeHandle(ref, () => ({
      fire: (clientX?: number, clientY?: number) => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        // Calculate origin based on click position (or use default center-lower)
        let originX = 0.5;
        let originY = 0.65;

        if (clientX !== undefined && clientY !== undefined) {
          // Convert client coordinates to canvas-relative (0-1 range)
          originX = (clientX - rect.left) / rect.width;
          originY = (clientY - rect.top) / rect.height;
        }

        const myConfetti = confetti.create(canvas, {
          resize: true,
          useWorker: false,
        });

        // Fire confetti from the click position
        const duration = 600;
        const animationEnd = Date.now() + duration;

        const randomInRange = (min: number, max: number) => {
          return Math.random() * (max - min) + min;
        };

        const frame = () => {
          myConfetti({
            particleCount: 3,
            angle: randomInRange(45, 135),
            spread: randomInRange(60, 90),
            origin: { x: originX, y: originY },
            shapes: ["circle", "square", "star"],
            ticks: 200,
            gravity: 0.8,
            scalar: 0.7,
          });

          if (Date.now() < animationEnd) {
            requestAnimationFrame(frame);
          }
        };

        frame();
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      return () => {
        if (canvas) {
          const ctx = canvas.getContext("2d");
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full pointer-events-none z-5 ${className}`}
      />
    );
  },
);

Confetti.displayName = "Confetti";
