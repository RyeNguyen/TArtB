import { ReactNode, useState, useMemo } from "react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useInteractions,
  FloatingPortal,
  useTransitionStyles,
  Placement,
  FloatingFocusManager,
  autoPlacement,
} from "@floating-ui/react";
import { Glass } from "@atoms/Glass";
import { PopoverContext, usePopoverContext } from "@hooks/usePopover";

interface PopoverProps {
  children: ReactNode;
  placement?: Placement;
  offset?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const Popover = ({
  children,
  offset: offsetValue = 8,
  open: controlledOpen,
  onOpenChange,
}: PopoverProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  const isOpen = controlledOpen ?? uncontrolledOpen;
  const setIsOpen = onOpenChange ?? setUncontrolledOpen;

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      autoPlacement(),
      offset(offsetValue),
      flip(),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
  ]);

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: 150,
    initial: {
      opacity: 0,
      transform: "scale(1)",
    },
  });

  const value = useMemo(
    () => ({
      isOpen,
      setIsOpen,
      refs,
      floatingStyles,
      getFloatingProps,
      getReferenceProps,
      transitionStyles,
      isMounted,
      context,
    }),
    [
      isOpen,
      setIsOpen,
      refs,
      floatingStyles,
      getFloatingProps,
      getReferenceProps,
      transitionStyles,
      isMounted,
      context,
    ],
  );

  return (
    <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>
  );
};

interface PopoverTriggerProps {
  children: ReactNode;
  className?: string;
}

export const PopoverTrigger = ({
  children,
  className = "",
}: PopoverTriggerProps) => {
  const { refs, getReferenceProps } = usePopoverContext();

  return (
    <div
      // eslint-disable-next-line react-hooks/refs
      ref={refs.setReference}
      {...getReferenceProps()}
      className={`cursor-pointer ${className}`}
    >
      {children}
    </div>
  );
};

interface PopoverContentProps {
  children: ReactNode;
  className?: string;
}

export const PopoverContent = ({
  children,
  className = "",
}: PopoverContentProps) => {
  const {
    refs,
    floatingStyles,
    getFloatingProps,
    transitionStyles,
    isMounted,
    context,
  } = usePopoverContext();

  if (!isMounted) return null;

  return (
    <FloatingPortal>
      <FloatingFocusManager context={context} modal={false}>
        <div
          // eslint-disable-next-line react-hooks/refs
          ref={refs.setFloating}
          style={{ ...floatingStyles, zIndex: 100 }}
          {...getFloatingProps()}
        >
          <div style={transitionStyles}>
            <Glass className={`p-2 shadow-none overflow-hidden ${className}`}>
              {children}
            </Glass>
          </div>
        </div>
      </FloatingFocusManager>
    </FloatingPortal>
  );
};

export const PopoverClose = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => {
  const { setIsOpen } = usePopoverContext();

  return (
    <div className={className} onClick={() => setIsOpen(false)}>
      {children}
    </div>
  );
};
