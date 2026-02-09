import { Dropdown } from "@atoms/Dropdown";
import { Typography } from "@atoms/Typography";
import { COLORS } from "@constants/colors";
import { TaskPriorityType } from "@constants/common";
import FlagIcon from "@icons/Flag";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface PrioritySelectorProps {
  children: ReactNode;
  value?: string;
  onChange?: (value: string) => void;
}

export const PrioritySelector = ({
  children,
  value,
  onChange,
}: PrioritySelectorProps) => {
  const { t } = useTranslation();

  const priorityData = [
    {
      label: (
        <div className="flex items-center gap-2">
          <FlagIcon color={COLORS.ERROR_400} size={16} />
          <Typography className="text-white">
            {t("toDo.priority.high")}
          </Typography>
        </div>
      ),
      value: TaskPriorityType.HIGH,
    },
    {
      label: (
        <div className="flex items-center gap-2">
          <FlagIcon color={COLORS.WARNING_400} size={16} />
          <Typography className="text-white">
            {t("toDo.priority.medium")}
          </Typography>
        </div>
      ),
      value: TaskPriorityType.MEDIUM,
    },
    {
      label: (
        <div className="flex items-center gap-2">
          <FlagIcon color={COLORS.BLUE_400} size={16} />
          <Typography className="text-white">
            {t("toDo.priority.low")}
          </Typography>
        </div>
      ),
      value: TaskPriorityType.LOW,
    },
    {
      label: (
        <div className="flex items-center gap-2">
          <FlagIcon size={16} />
          <Typography className="text-white">
            {t("toDo.priority.none")}
          </Typography>
        </div>
      ),
      value: TaskPriorityType.NONE,
    },
  ];

  return (
    <Dropdown
      data={priorityData}
      value={value}
      header={t("toDo.priority.title")}
      onChange={onChange}
    >
      {children}
    </Dropdown>
  );
};
