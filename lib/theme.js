import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

// Temel (renkten bağımsız) tokenler: arkaplan/yüzey/metin + sabit anlamsal renkler.
// "success" (alevlendi/eşleşti) hep yeşil, "danger" (hata) hep kırmızı kalır —
// bunlar durum anlamı taşıdığı için kullanıcı rengi seçiminden etkilenmez.
const base = {
  dark: {
    background: "#0C0C0E",
    surface: "#17161A",
    surfaceElevated: "#201F24",
    border: "#2B2A2F",
    textPrimary: "#F2F0F1",
    textSecondary: "#9A9599",
    success: "#33A363",
    successMuted: "#16281C",
    danger: "#E6394A",
  },
  light: {
    background: "#FBF9F8",
    surface: "#FFFFFF",
    surfaceElevated: "#F3EFEF",
    border: "#E8E2E2",
    textPrimary: "#201C1D",
    textSecondary: "#7A7376",
    success: "#1F8A50",
    successMuted: "#E4F3E9",
    danger: "#D42F33",
  },
};

// Seçilebilir "marka rengi" — butonlar, kalp, linkler, aktif sekme vb. buradan gelir.
const accentPalettes = {
  pink: {
    dark: { accent: "#dd5396", accentSoft: "#ffbfdc", accentMuted: "#422634" },
    light: { accent: "#eb4791", accentSoft: "#522b3d", accentMuted: "#f5d0e1" },
  },
  blue: {
    dark: { accent: "#4572bb", accentSoft: "#9BC0F7", accentMuted: "#15223A" },
    light: { accent: "#2960d8", accentSoft: "#070a11", accentMuted: "#dee9ff" },
  },
  yellow: {
    dark: { accent: "#fdb818", accentSoft: "#fddf9d", accentMuted: "#533f0b" },
    light: { accent: "#ffbb00", accentSoft: "#865e00", accentMuted: "#fff7e0" },
  },
  purple: {
    dark: { accent: "#9829ff", accentSoft: "#e8cdff", accentMuted: "#341d49" },
    light: { accent: "#9c5bd4", accentSoft: "#44384d", accentMuted: "#e5c6f7" },
  },
  orange: {
    dark: { accent: "#ff6a00", accentSoft: "#F8B27E", accentMuted: "#3A2210" },
    light: { accent: "#f05d0d", accentSoft: "#4b301c", accentMuted: "#FCE9DA" },
  },
};

function buildColors(scheme, accentColor) {
  return { ...base[scheme], ...accentPalettes[accentColor][scheme] };
}

const ThemeContext = createContext({
  scheme: "dark",
  accentColor: "pink",
  colors: buildColors("dark", "pink"),
  setScheme: () => {},
  setAccentColor: () => {},
});

export function ThemeProvider({ children }) {
  const [scheme, setSchemeState] = useState("dark");
  const [accentColor, setAccentColorState] = useState("pink");

  useEffect(() => {
    let mounted = true;

    const loadForUser = async (userId) => {
      if (!userId) return;
      const { data } = await supabase
        .from("profiles")
        .select("theme_preference, accent_color")
        .eq("id", userId)
        .single();
      if (mounted && data) {
        if (data.theme_preference) setSchemeState(data.theme_preference);
        if (data.accent_color) setAccentColorState(data.accent_color);
      }
    };

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => loadForUser(session?.user?.id));
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        loadForUser(session?.user?.id);
      },
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const setScheme = async (next) => {
    setSchemeState(next);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ theme_preference: next })
        .eq("id", user.id);
    }
  };

  const setAccentColor = async (next) => {
    setAccentColorState(next);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ accent_color: next })
        .eq("id", user.id);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        scheme,
        accentColor,
        colors: buildColors(scheme, accentColor),
        setScheme,
        setAccentColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
