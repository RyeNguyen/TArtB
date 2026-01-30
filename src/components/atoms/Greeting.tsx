import { useTranslation } from "react-i18next";
import { Typography } from "@atoms/Typography";
import { DayTimeType, TypoVariants, WidgetId } from "@constants/common";
import { useSettingsStore } from "@stores/settingsStore";

export const Greeting = () => {
  const { t } = useTranslation();
  const { settings } = useSettingsStore();

  const greetingSettings = settings.widgets[WidgetId.GREETING];

  if (!greetingSettings.enabled) return null;

  const hour = new Date().getHours();

  const getGreetingKey = (): DayTimeType => {
    if (hour >= 5 && hour < 12) return DayTimeType.MORNING;
    if (hour >= 12 && hour < 17) return DayTimeType.AFTERNOON;
    if (hour >= 17 && hour < 21) return DayTimeType.EVENING;
    return DayTimeType.NIGHT;
  };

  const key = getGreetingKey();

  return (
    <div className="flex flex-col gap-1 items-center w-full pt-3 border-t border-white/10">
      <Typography variant={TypoVariants.SUBTITLE}>
        {t(`greetings.${key}.title`)}
      </Typography>

      <Typography className="text-center">
        {t(`greetings.${key}.subtitle`)}
      </Typography>
    </div>
  );
};
