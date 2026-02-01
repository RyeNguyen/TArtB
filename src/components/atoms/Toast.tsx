import { AnimatePresence, motion } from "framer-motion";
import { useToastStore, type Toast } from "@stores/toastStore";
import { Button } from "@atoms/button/Button";
import CloseIcon from "@icons/Close";
import CheckCircleIcon from "@icons/CheckCircle";
import ErrorIcon from "@icons/Error";
import InfoIcon from "@icons/Info";
import { COLORS } from "@constants/colors";
import { Typography } from "@atoms/Typography";

const TOAST_ICONS = {
  success: CheckCircleIcon,
  error: ErrorIcon,
  info: InfoIcon,
};

const TOAST_COLORS = {
  success: COLORS.SUCCESS_400,
  error: COLORS.ERROR_400,
  info: COLORS.BLUE_400,
};

interface ToastItemProps {
  toast: Toast;
}

const ToastItem = ({ toast }: ToastItemProps) => {
  const { removeToast } = useToastStore();
  const Icon = TOAST_ICONS[toast.type];
  const iconColor = TOAST_COLORS[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-lg min-w-[300px] max-w-[400px]"
    >
      <Icon color={iconColor} size={20} />

      <div className="flex-1 min-w-0">
        <Typography className="text-white text-sz-default break-words">
          {toast.message}
        </Typography>
      </div>

      <div className="flex items-center gap-2">
        {toast.action && (
          <button
            onClick={() => {
              toast.action!.onClick();
              removeToast(toast.id);
            }}
            className="text-white text-sz-small font-medium hover:opacity-80 transition-opacity whitespace-nowrap"
          >
            {toast.action.label}
          </button>
        )}

        <button
          onClick={() => removeToast(toast.id)}
          className="text-white/60 hover:text-white transition-colors"
          aria-label="Close"
        >
          <CloseIcon size={16} />
        </button>
      </div>
    </motion.div>
  );
};

export const ToastContainer = () => {
  const { toasts } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};
