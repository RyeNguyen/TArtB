import { useState, useEffect } from "react";
import { useSettingsStore } from "../../../stores";
import { AnalogClock } from "@atoms/clock/Analog";
import { DigitalClock } from "@atoms/clock/Digital";
import { ClockType, TimeFormat } from "@constants/common";
import { WidgetId } from "@constants/common";
import { WidgetWrapper } from "@atoms/WidgetWrapper";
import { DisplayDate } from "@atoms/DisplayDate";
import { Greeting } from "@atoms/Greeting";

export const Clock = () => {
  const { settings } = useSettingsStore();
  const [time, setTime] = useState(new Date());

  const clockSettings = settings.widgets[WidgetId.CLOCK];

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!clockSettings.enabled) return null;

  if (!clockSettings.visible) return null;

  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();

  // Digital clock preparation
  const is12h = settings.widgets[WidgetId.CLOCK].timeFormat === TimeFormat.H12;
  const digitalHours = is12h
    ? (hours % 12 || 12).toString().padStart(2, "0")
    : hours.toString().padStart(2, "0");
  const digitalMinutes = minutes.toString().padStart(2, "0");
  const amPm = is12h ? (hours >= 12 ? " PM" : " AM") : "";
  const showColon = time.getSeconds() % 2 === 0;

  // Analog clock preparation
  const secDeg = (time.getTime() / 1000) * 6; // 360 / 60 = 6 degrees per second
  const minDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  return (
    <WidgetWrapper
      widgetId={WidgetId.CLOCK}
      defaultPosition={{ x: window.innerWidth - 200, y: 16 }}
      innerGlassClassName="flex flex-col gap-3 max-w-65"
    >
      <div className="flex flex-col gap-1 items-center">
        {clockSettings.type === ClockType.ANALOG ? (
          <AnalogClock hourDeg={hourDeg} minDeg={minDeg} secDeg={secDeg} />
        ) : (
          <DigitalClock
            displayHours={digitalHours}
            displayMinutes={digitalMinutes}
            is12h={is12h}
            amPm={amPm}
            showColon={showColon}
          />
        )}

        <DisplayDate />
      </div>

      <Greeting />
    </WidgetWrapper>
  );
};
