import type { AppTheme } from "@/styles/theme";
import { darkTheme, lightTheme, ThemeType } from "@/styles/theme";
import { APP_PREFIX } from "@/config/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useColorScheme } from "react-native";

const THEME_STORAGE_KEY = `${APP_PREFIX}:theme`;

interface ThemeContextValue {
  theme: AppTheme;
  themeType: ThemeType;
  setThemeType: (type: ThemeType) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeType, setThemeTypeState] = useState<ThemeType>("system");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored: string | null) => {
      if (stored === "light" || stored === "dark" || stored === "system") {
        setThemeTypeState(stored);
      }
      setIsReady(true);
    });
  }, []);

  const setThemeType = useCallback(async (type: ThemeType) => {
    setThemeTypeState(type);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, type);
  }, []);

  const getActiveTheme = useCallback((): AppTheme => {
    if (themeType === "system") {
      return systemColorScheme === "dark" ? darkTheme : lightTheme;
    }
    return themeType === "dark" ? darkTheme : lightTheme;
  }, [themeType, systemColorScheme]);

  const theme = getActiveTheme();
  const isDark = theme.dark;

  if (!isReady) return null;

  return (
    <ThemeContext.Provider value={{ theme, themeType, setThemeType, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useAppTheme must be used within AppThemeProvider");
  return context;
}
