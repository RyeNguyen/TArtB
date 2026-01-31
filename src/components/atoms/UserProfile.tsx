import { useAuthStore } from "@stores/authStore";
import { Popover, PopoverTrigger, PopoverContent } from "./Popover";
import { Typography } from "./Typography";
import { TypoVariants } from "@constants/common";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export const UserProfile = () => {
  const { t } = useTranslation();
  const { user, isLoading, signInWithGoogle, signOut } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Not signed in - show sign in button
  if (!user) {
    return (
      <button
        onClick={handleSignIn}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
      >
        <GoogleIcon />
        <Typography>
          {isLoading ? t("auth.signingIn") : t("auth.signIn")}
        </Typography>
      </button>
    );
  }

  // Signed in - show avatar with popover
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger>
        <button className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/10 transition-colors">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || "User"}
              className="w-8 h-8 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <Typography>
                {user.displayName?.charAt(0) || user.email?.charAt(0) || "?"}
              </Typography>
            </div>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="p-3 min-w-[200px]">
        <div className="flex flex-col gap-3">
          {/* User info */}
          <div className="flex items-center gap-3">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="w-10 h-10 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Typography>
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || "?"}
                </Typography>
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <Typography className="truncate">
                {user.displayName || t("auth.user")}
              </Typography>
              <Typography
                variant={TypoVariants.SUBTITLE}
                className="text-white/50 truncate"
              >
                {user.email}
              </Typography>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10" />

          {/* Sign out button */}
          <button
            onClick={handleSignOut}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <Typography>
              {isLoading ? t("auth.signingOut") : t("auth.signOut")}
            </Typography>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Google icon component
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path
      d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      fill="#4285F4"
    />
    <path
      d="M9.003 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.26c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332A8.997 8.997 0 0 0 9.003 18z"
      fill="#34A853"
    />
    <path
      d="M3.964 10.712A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.33z"
      fill="#FBBC05"
    />
    <path
      d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.002 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29c.708-2.127 2.692-3.71 5.036-3.71z"
      fill="#EA4335"
    />
  </svg>
);
