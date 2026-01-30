import { useArtworkStore } from "@stores/artworkStore";
import { useSettingsStore } from "@stores/settingsStore";
import { Typography } from "@atoms/Typography";
import { TypoVariants } from "@constants/common";
import GoogleIcon from "@icons/Google";
import YoutubeIcon from "@icons/Youtube";
import WikipediaIcon from "@icons/Wikipedia";
import { WidgetWrapper } from "@atoms/WidgetWrapper";
import RefreshIcon from "@icons/Refresh";
import { WidgetId } from "@constants/common";
import { useArtwork } from "@hooks/useArtwork";
import { useMemo } from "react";

export const ArtworkInfo = () => {
  const { currentArtwork } = useArtworkStore();
  const { settings } = useSettingsStore();
  const { refetch, isLoading } = useArtwork();

  const searchQuery = useMemo(() => {
    return currentArtwork ? encodeURIComponent(
    `${currentArtwork.title} painting by ${currentArtwork.artist}`,
  ) : null
  }, [currentArtwork]) ;

  const searchLinks = [
    {
      icon: <GoogleIcon />,
      url: `https://www.google.com/search?q=${searchQuery}`,
    },
    {
      icon: <YoutubeIcon />,
      url: `https://www.youtube.com/results?search_query=${searchQuery}`,
    },
    {
      icon: <WikipediaIcon />,
      url: `https://en.wikipedia.org/wiki/Special:Search?search=${searchQuery}`,
    },
  ];

  const artworkInfoSettings = settings.widgets[WidgetId.ARTWORK_INFO];

  if (!artworkInfoSettings.enabled) return null;

  if (!artworkInfoSettings.visible) return null;

  return (
    <WidgetWrapper
      widgetId={WidgetId.ARTWORK_INFO}
      defaultPosition={{ x: 16, y: 16 }}
      wrapperClassName="w-[320px]"
      innerGlassClassName="flex flex-col"
    >
      <Typography variant={TypoVariants.SUBTITLE} isLoading={isLoading} className="font-bold mb-1">
        {currentArtwork?.title}
      </Typography>
      <Typography isLoading={isLoading} className="text-white/70 text-sm italic mb-4">
        {currentArtwork?.artist}, {currentArtwork?.date}
      </Typography>

      {!isLoading && <div className="flex justify-between pt-4 border border-transparent border-t-white/10">
        <a onClick={() => refetch()} className="cursor-pointer hover:rotate-180 transition-all duration-300">
          <RefreshIcon />
        </a>

        <div className="flex gap-6">
          {searchLinks.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="cursor-pointer"
            >
              {link.icon}
            </a>
          ))}
        </div>
      </div>}
    </WidgetWrapper>
  );
};
