import { Variants } from "framer-motion";

/**
 * Fade in/out animation for elements that appear on hover
 * Usage: Apply to elements that should fade in when parent is hovered
 */
export const fadeInOut: Variants = {
  hidden: {
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: "easeOut",
    },
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

/**
 * Scale + fade animation for buttons/icons on hover
 * Adds a subtle scale effect along with opacity
 */
export const scaleAndFade: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.15,
      ease: "easeOut",
    },
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.04, 0.62, 0.23, 0.98],
    },
  },
};

/**
 * Slide in from right with fade
 * Useful for icons/buttons that slide in on hover
 */
export const slideInFromRight: Variants = {
  hidden: {
    opacity: 0,
    x: 10,
    transition: {
      duration: 0.15,
      ease: "easeOut",
    },
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
};