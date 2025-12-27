
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Language = "es" | "en";

interface LanguageState {
    language: Language;
    setLanguage: (lang: Language) => void;
    toggleLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>()(
    persist(
        (set) => ({
            language: "es", // Default to Spanish
            setLanguage: (lang) => set({ language: lang }),
            toggleLanguage: () => set((state) => ({ language: state.language === "es" ? "en" : "es" })),
        }),
        {
            name: "language-storage",
        }
    )
);
