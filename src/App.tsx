import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SettingIcon from "@icons/Setting";
import { ArtworkInfo } from "@molecules/ArtworkInfo";
import { InteractiveArtwork } from "./components/organisms/InteractiveArtwork";
import { GlassButton } from "@atoms/button/GlassButton";
import { SettingsSidebar } from "@organisms/Sidebar";
import { useArtwork } from "@hooks/useArtwork";
import { Clock } from "@atoms/clock/Clock";
import { useSettingsStore } from "@stores/settingsStore";
import { useAuthStore } from "@stores/authStore";
import { useTranslation } from "react-i18next";
import { DockStation } from "@molecules/DockStation";
import { ToDo } from "@organisms/toDo/ToDo";
import { UserProfile } from "@atoms/UserProfile";
import { ToastContainer } from "@atoms/Toast";

function App() {
  const { i18n } = useTranslation();
  const { artwork } = useArtwork();
  const { settings, exitFocusMode } = useSettingsStore();
  const { initialize: initializeAuth } = useAuthStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [initialSettingsCategory, setInitialSettingsCategory] = useState<
    string | undefined
  >();

  // Check if any widget is in focus mode AND visible
  const focusedWidget = settings.focusedWidget;
  const isAnyWidgetFocused =
    focusedWidget !== null && settings.widgets[focusedWidget]?.visible;

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, [initializeAuth]);

  useEffect(() => {
    i18n.changeLanguage(settings.app.language);
  }, [i18n, settings.app.language]);

  const handleOpenSettings = (category?: string) => {
    setInitialSettingsCategory(category);
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
    setInitialSettingsCategory(undefined);
  };

  // if (isLoading && !artwork) {
  //   return (
  //     <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
  //         <p className="text-white text-lg">Loading artwork...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // if (error && !artwork) {
  //   return (
  //     <div className="fixed inset-0 flex items-center justify-center bg-gray-900">
  //       <div className="text-center text-white px-4">
  //         <svg
  //           className="w-16 h-16 mx-auto mb-4 text-red-400"
  //           fill="none"
  //           stroke="currentColor"
  //           viewBox="0 0 24 24"
  //         >
  //           <path
  //             strokeLinecap="round"
  //             strokeLinejoin="round"
  //             strokeWidth={2}
  //             d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
  //           />
  //         </svg>
  //         <h2 className="text-xl font-semibold mb-2">Failed to load artwork</h2>
  //         <p className="text-gray-400">Please check your internet connection</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {artwork?.imageUrl && <InteractiveArtwork imageUrl={artwork.imageUrl} />}

      {/* Shared backdrop for focus mode - stays visible when switching widgets */}
      <AnimatePresence>
        {isAnyWidgetFocused && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            style={{ zIndex: 59 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={exitFocusMode}
          />
        )}
      </AnimatePresence>

      <ArtworkInfo />

      <Clock />

      <ToDo />

      <DockStation onOpenSettings={handleOpenSettings} />

      {/* User profile - top right */}
      <div className="fixed top-4 right-4 z-10">
        <UserProfile />
      </div>

      <GlassButton
        isIconButton
        className="fixed bottom-4 right-4 z-10"
        onClick={() => handleOpenSettings()}
      >
        <SettingIcon />
      </GlassButton>

      <SettingsSidebar
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
        initialCategory={initialSettingsCategory}
      />

      <ToastContainer />
    </div>
  );
}

export default App;
