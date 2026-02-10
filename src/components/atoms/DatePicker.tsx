import { ReactNode, useState } from "react";
import { Chevron, DayPicker } from "react-day-picker";
import { vi, enUS } from "date-fns/locale";
import { isToday, isTomorrow, startOfDay, type Locale } from "date-fns";
import { useTranslation } from "react-i18next";

import { Popover, PopoverTrigger, PopoverContent } from "@atoms/Popover";
import { Button } from "@atoms/button/Button";
import ChevronIcon from "@icons/Chevron";

const localeMap: Record<string, Locale> = { vi, en: enUS };

interface DatePickerProps {
  children: ReactNode;
  value?: number;
  onChange?: (value: number | undefined) => void;
}

const CustomChevron = ({ orientation }: { orientation?: string }) => {
  switch (orientation) {
    case "left":
      return <ChevronIcon className="rotate-90" />;
    case "right":
      return <ChevronIcon className="-rotate-90" />;
    default:
      return <Chevron />;
  }
};

export const DatePicker = ({ children, value, onChange }: DatePickerProps) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const selected = value ? startOfDay(new Date(value)) : undefined;

  const handleSelect = (day: Date | undefined) => {
    if (!onChange) return;
    if (day && selected && day.getTime() === selected.getTime()) {
      onChange(undefined);
    } else {
      onChange(day ? startOfDay(day).getTime() : undefined);
    }
    setIsOpen(false);
  };

  const handleQuickSelect = (date?: Date) => {
    if (!onChange) return;
    const ts = date ? startOfDay(date).getTime() : undefined;
    if (value && startOfDay(new Date(value)).getTime() === ts) {
      onChange(undefined);
    } else {
      onChange(ts);
    }
    setIsOpen(false);
  };

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <div className="relative inline-flex">
        <PopoverTrigger>{children}</PopoverTrigger>

        <PopoverContent>
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            showOutsideDays
            fixedWeeks
            components={{
              Chevron: CustomChevron,
            }}
            disabled={{ before: startOfDay(new Date()) }}
            locale={localeMap[i18n.language] || enUS}
            modifiersClassNames={{
              selected: "rounded-2xl bg-white/40 font-semibold",
              today: "rounded-2xl border border-white/50",
            }}
            classNames={{
              root: "text-white",
              months: "flex flex-col",
              month_caption:
                "flex font-medium uppercase text-white text-[18px] my-1 mx-2",
              nav: "absolute top-1 right-2 flex items-center gap-1",
              button_previous:
                "p-1 hover:bg-white/20 rounded-lg cursor-pointer",
              button_next: "p-1 hover:bg-white/20 rounded-lg cursor-pointer",
              month_grid: "w-full border-collapse",
              weekdays: "flex",
              weekday:
                "w-10 text-center text-white text-[18px] font-medium mt-3 mb-1",
              week: "flex",
              day: "w-10 h-10 text-center text-[18px] font-light",
              day_button:
                "w-full h-full flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors cursor-pointer",
              outside: "text-white/20",
              disabled: "text-white/20 cursor-not-allowed hover:bg-transparent",
            }}
          />
          <div className="flex justify-between mt-2">
            <Button
              textClassName="text-gray-300!"
              text={t("toDo.deadline.clear")}
              isOutline
              onClick={() => handleQuickSelect(undefined)}
            />

            <div className="flex items-center gap-2">
              <Button
                textClassName="text-gray-300!"
                text={t("toDo.deadline.today")}
                isOutline={!value || !isToday(new Date(value))}
                onClick={() => handleQuickSelect(today)}
              />
              <Button
                textClassName="text-gray-300!"
                text={t("toDo.deadline.tomorrow")}
                isOutline={!value || !isTomorrow(new Date(value))}
                onClick={() => handleQuickSelect(tomorrow)}
              />
            </div>
          </div>
        </PopoverContent>
      </div>
    </Popover>
  );
};
