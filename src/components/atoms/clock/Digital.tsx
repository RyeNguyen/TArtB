interface DigitalClockProps {
  displayHours: string;
  displayMinutes: string;
  is12h: boolean;
  amPm: string;
  showColon: boolean;
}

export const DigitalClock = ({
  displayHours,
  displayMinutes,
  is12h,
  amPm,
  showColon,
}: DigitalClockProps) => {
  return (
    <div className="text-6xl font-bold text-white flex items-center justify-end">
      <span>{displayHours}</span>

      <span
        className={`transition-opacity duration-100 ${showColon ? "opacity-100" : "opacity-0"}`}
      >
        :
      </span>

      <span>{displayMinutes}</span>

      {is12h && <span className="ml-4">{amPm}</span>}
    </div>
  );
};
