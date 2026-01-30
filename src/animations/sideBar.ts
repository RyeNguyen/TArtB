export const sidebarAnimationVariants = {
  closed: { 
    x: "100%",
    transition: {
      type: "spring",
      stiffness: 180, 
      damping: 30,
    }
  },
  open: { 
    x: 0, 
    transition: {
      type: "spring",
      stiffness: 180,
      damping: 28
    }
  }
} as const;

export const columnAnimationVariants = {
  closed: { 
    x: 40, 
    opacity: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 30
    }
  },
  open: { 
    x: 0, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100, 
      damping: 20,
      delay: 0.25,
    }
  }
} as const;