import React, { createContext, useContext } from "react";

export type Language = "es" | "en";

export type LocalizedString = {
    es: string;
    en: string;
};

const DashboardLangContext = createContext<Language>("es");

export function DashboardLangProvider({ lang, children }: { lang: Language; children: React.ReactNode }) {
    return <DashboardLangContext.Provider value={lang}>{children}</DashboardLangContext.Provider>;
}

export function useDashboardLang() {
    return useContext(DashboardLangContext);
}

export const translate = (value: LocalizedString, lang: Language) => (lang === "en" ? value.en : value.es);
export const translateValue = (value: LocalizedString | string, lang: Language) => (typeof value === "string" ? value : translate(value, lang));
