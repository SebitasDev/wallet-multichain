import { create } from "zustand";

export type Language = "es" | "en";

type LanguageState = {
    language: Language;
    setLanguage: (language: Language) => void;
    toggleLanguage: () => void;
};

export const useLanguageStore = create<LanguageState>((set) => ({
    language: "es",
    setLanguage: (language) => set({ language }),
    toggleLanguage: () =>
        set((state) => ({ language: state.language === "es" ? "en" : "es" })),
}));

export const getCurrentLanguage = () => useLanguageStore.getState().language;
