import { motion, useSpring, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

interface AnalogClockProps {
  hourDeg: number;
  minDeg: number;
  secDeg: number;
}

export const AnalogClock = ({ hourDeg, minDeg, secDeg }: AnalogClockProps) => {
  const prevSecDeg = useRef(secDeg);
  const cumulativeRotation = useRef(secDeg);

  useEffect(() => {
    const diff = secDeg - prevSecDeg.current;
    if (diff < -180) {
      cumulativeRotation.current += 360 + diff;
    } else {
      cumulativeRotation.current += diff;
    }
    prevSecDeg.current = secDeg;
  }, [secDeg]);

  const springConfig = { stiffness: 100, damping: 20 };
  // eslint-disable-next-line react-hooks/refs
  const rotationMotion = useMotionValue(cumulativeRotation.current);
  const smoothRotation = useSpring(rotationMotion, springConfig);

  useEffect(() => {
    rotationMotion.set(cumulativeRotation.current);
  }, [secDeg, rotationMotion]);

  const dotRadius = 40;
  const dotX = useTransform(
    smoothRotation,
    (r) => 50 + dotRadius * Math.sin((r * Math.PI) / 180),
  );
  const dotY = useTransform(
    smoothRotation,
    (r) => 50 - dotRadius * Math.cos((r * Math.PI) / 180),
  );

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="white"
          strokeWidth="3.4"
        />

        <line
          x1="50"
          y1="50"
          x2="50"
          y2="20"
          stroke="#DBDBDB"
          strokeWidth="4"
          strokeLinecap="round"
          style={{
            transform: `rotate(${minDeg}deg)`,
            transformOrigin: "50px 50px",
          }}
          className="transition-transform duration-500 ease-in-out"
        />

        <line
          x1="50"
          y1="50"
          x2="50"
          y2="30"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          style={{
            transform: `rotate(${hourDeg}deg)`,
            transformOrigin: "50px 50px",
          }}
          className="transition-transform duration-500 ease-in-out"
        />

        <motion.circle cx={dotX} cy={dotY} r="4" fill="white" />
      </svg>
    </div>
  );
};
