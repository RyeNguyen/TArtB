import { useState, useEffect } from "react";
import { format, type Locale } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";

import { useSettingsStore } from "@stores/settingsStore";
import { TypoVariants, WidgetId } from "@constants/common";
import { Typography } from "@atoms/Typography";

const localeMap: Record<string, Locale> = { vi, en: enUS };
const dateFormatMap: Record<string, string> = {
  vi: "EEEE, d MMMM",
  en: "EEEE, MMMM d",
};

export const DisplayDate = () => {
  const { i18n } = useTranslation();
  const { settings } = useSettingsStore();

  const [time, setTime] = useState(new Date());

  const dateSettings = settings.widgets[WidgetId.DATE];

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!dateSettings.enabled) return null;

  const dateFormat = dateFormatMap[i18n.language] || dateFormatMap.en;

  return (
    <Typography variant={TypoVariants.SUBTITLE}>
      {format(time, dateFormat, { locale: localeMap[i18n.language] || enUS })}
    </Typography>
  );
};
