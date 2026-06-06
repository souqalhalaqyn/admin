import { DefaultTheme, Theme } from "@react-navigation/native";

export type AppTheme = Theme & {
  colors: Theme["colors"] & {
    backgroundSecond: string;
    textSecond: string;
    primary: string;
    primarySecond: string;
    gray: string;
    graySecond: string;
    red: string;
    redSecond: string;
    blue: string;
    blueSecond: string;
    green: string;
    greenSecond: string;
  };
};

export const lightTheme: AppTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    background: "#F8FAFC",
    backgroundSecond: "#FFFFFF",
    text: "#0F172A",
    textSecond: "#64728B",
    primary: "#FBBF24",
    primarySecond: "#D97706",
    gray: "#E2E8F0",
    graySecond: "#94A3B8",
    red: "#EF4444",
    redSecond: "#B91C1C",
    blue: "#3B82F6",
    blueSecond: "#1D4ED8",
    green: "#10B981",
    greenSecond: "#047857",
  },
};

export const darkTheme: AppTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: "#0F172A",
    backgroundSecond: "#1E293B",
    text: "#F8FAFC",
    textSecond: "#94A3B8",
    primary: "#FBBF24",
    primarySecond: "#D97706",
    gray: "#334155",
    graySecond: "#475569",
    red: "#EF4444",
    redSecond: "#B91C1C",
    blue: "#3B82F6",
    blueSecond: "#1D4ED8",
    green: "#10B981",
    greenSecond: "#047857",
  },
};

export type ThemeType = "light" | "dark" | "system";
