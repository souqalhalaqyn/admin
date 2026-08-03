import { APP_PREFIX } from "@/config/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import * as Updates from "expo-updates";
import i18n, { changeLanguage as setI18nLanguage } from "i18next";
import { initReactI18next } from "react-i18next";
import { DevSettings, I18nManager } from "react-native";
import ar from "./ar.json";
import en from "./en.json";

const resources = {
  en: { translation: en },
  ar: { translation: ar },
};

const LANGUAGE_STORAGE_KEY = `${APP_PREFIX}:language`;

export type LanguageCode = "en" | "ar";

export async function initI18n() {
  const storedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  const deviceLocale = getLocales()[0].languageCode ?? "en";
  const initialLang =
    storedLang === "en" || storedLang === "ar"
      ? storedLang
      : deviceLocale.startsWith("ar")
        ? "ar"
        : "en";

  // eslint-disable-next-line import/no-named-as-default-member
  i18n.use(initReactI18next).init({
    resources,
    lng: initialLang,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
      prefix: "{",
      suffix: "}",
    },
  });

  return initialLang;
}

export async function changeLanguage(lang: LanguageCode) {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  await setI18nLanguage(lang);

  const shouldBeRTL = lang === "ar";
  I18nManager.allowRTL(shouldBeRTL);
  I18nManager.forceRTL(shouldBeRTL);

  setTimeout(() => {
    if (__DEV__) {
      DevSettings.reload();
    } else {
      Updates.reloadAsync();
    }
  }, 100);
}

export default i18n;
