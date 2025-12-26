"use client";

import { useEffect, useState } from "react";
import { Language } from "@/app/landing-translations";
import { Hero } from "@/app/components/landing/Hero";
import { Stats } from "@/app/components/landing/Stats";
import { Chains } from "@/app/components/landing/Chains";
import { Features } from "@/app/components/landing/Features";
import { MainFeatures } from "@/app/components/landing/MainFeatures";
import { UseCases } from "@/app/components/landing/UseCases";
import { Comparison } from "@/app/components/landing/Comparison";
import { FAQ } from "@/app/components/landing/FAQ";
import { CTA } from "@/app/components/landing/CTA";
import { Footer } from "@/app/components/landing/Footer";

export default function Home() {
    const [lang, setLang] = useState<Language>("es");

    useEffect(() => {
        if (typeof window === "undefined") return;
        const saved = window.localStorage.getItem("multichain_lang") as Language | null;
        if (saved === "en" || saved === "es") {
            setLang(saved);
        }
    }, []);

    const toggleLanguage = () =>
        setLang((current) => {
            const next = current === "es" ? "en" : "es";
            if (typeof window !== "undefined") {
                window.localStorage.setItem("multichain_lang", next);
            }
            return next;
        });

    return (
        <main style={{ backgroundColor: "#ffffff", color: "#000000", minHeight: "100vh" }}>
            <Hero lang={lang} onToggleLanguage={toggleLanguage} />
            <Stats lang={lang} />
            <Chains lang={lang} />
            <Features lang={lang} />
            <MainFeatures lang={lang} />
            <UseCases lang={lang} />
            <Comparison lang={lang} />
            <FAQ lang={lang} />
            <CTA lang={lang} />
            <Footer lang={lang} />
        </main>
    );
}