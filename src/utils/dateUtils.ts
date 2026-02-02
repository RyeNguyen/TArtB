import { COLORS } from "@constants/colors";
import { isPast, isToday, isTomorrow } from "date-fns";

export const getDeadlineColor = (deadline?: Date) => {
  if (!deadline) return COLORS.BLUE_50;
  if (isToday(deadline) || isTomorrow(deadline)) {
    return COLORS.WARNING_50;
  } else if (isPast(deadline)) {
    return COLORS.ERROR_50;
  } else {
    return COLORS.BLUE_50;
  }
};
