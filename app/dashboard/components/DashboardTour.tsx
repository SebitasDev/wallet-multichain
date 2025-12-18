"use client";

import { useEffect, useRef } from "react";
import Shepherd, { Tour } from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";
import { useWalletStore } from "@/app/store/useWalletsStore";

const tourOptions = {
    defaultStepOptions: {
        cancelIcon: {
            enabled: true,
        },
        classes: "shepherd-theme-custom",
        scrollTo: { behavior: "smooth", block: "center" },
    },
    useModalOverlay: true,
};

export function DashboardTour() {
    const tourRef = useRef<Tour | null>(null);
    const wallets = useWalletStore((s) => s.wallets);
    const hasWallets = wallets.length > 0;

    // Two distinct keys for progressive onboarding
    const KEY_INTRO = "hasSeenOnboarding_v12_INTRO";
    const KEY_WALLET = "hasSeenOnboarding_v12_WALLET";

    // --- STEP DEFINITIONS ---

    // 1. INTRO TOUR (General UI + Call to Action)
    const getIntroSteps = (tour: Tour) => {
        const next = () => tour.next();
        const back = () => tour.back();

        return [
            {
                id: "welcome",
                attachTo: { element: "#dashboard-hero", on: "bottom" },
                beforeShowPromise: function () {
                    return new Promise<void>(function (resolve) {
                        setTimeout(function () {
                            window.scrollTo(0, 0);
                            resolve();
                        }, 500);
                    });
                },
                buttons: [
                    { classes: "shepherd-button-primary", text: "Comenzar", action: next },
                ],
                cancelIcon: { enabled: true },
                title: "🚀 ¡Bienvenido a 1LLET!",
                text: "Estás ante la billetera más rápida y rebelde de la Web3. Te enseñaremos lo básico.",
            },
            {
                id: "action-add",
                attachTo: { element: "#tour-action-add", on: "bottom" },
                buttons: [
                    { classes: "shepherd-button-secondary", text: "Atrás", action: back },
                    { classes: "shepherd-button-primary", text: "Siguiente", action: next },
                ],
                title: "Importar o Crear",
                text: "Aquí podrás conectar tus wallets existentes (Metamask, Phantom, etc).",
            },
            {
                id: "profile-stats",
                attachTo: { element: "#tour-profile", on: "bottom" },
                buttons: [
                    { classes: "shepherd-button-secondary", text: "Atrás", action: back },
                    { classes: "shepherd-button-primary", text: "Siguiente", action: next },
                ],
                title: "Tu Perfil",
                text: "Revisa tus medallas, estadísticas y nivel de Degen aquí mismo.",
            },
            {
                id: "generate-wallet-cta",
                attachTo: { element: "#tour-generate-wallet", on: "top" },
                buttons: [
                    { classes: "shepherd-button-secondary", text: "Atrás", action: back },
                    { classes: "shepherd-button-primary", text: "¡Entendido!", action: next },
                ],
                title: "🔥 Paso Crucial",
                text: "Para empezar a operar, necesitarás una wallet. ¡Dale click a este botón para generar una en un segundo! (El tour continuará después)",
            }
        ];
    };

    // 2. WALLET TOUR (Triggered ONLY when user has wallets)
    const getWalletSteps = (tour: Tour) => {
        const next = () => tour.next();
        const back = () => tour.back();

        return [
            {
                id: "wallet-success",
                attachTo: { element: "#wallets-list", on: "top" },
                buttons: [
                    { classes: "shepherd-button-primary", text: "Ver Billetera", action: next },
                ],
                cancelIcon: { enabled: true },
                title: "✅ ¡Wallet Creada!",
                text: "¡Felicidades! Ahora tienes una identidad en la blockchain. Veamos qué puedes hacer con ella.",
            },
            {
                id: "hub-intro",
                attachTo: { element: "#main-wallet-actions", on: "right" },
                buttons: [
                    { classes: "shepherd-button-secondary", text: "Atrás", action: back },
                    { classes: "shepherd-button-primary", text: "Siguiente", action: next },
                ],
                title: "Panel de Control",
                text: "Estos son tus superpoderes: Generar más keys, Enviar crypto y usar el Bridge.",
            },
            {
                id: "send-action-main",
                attachTo: { element: "#tour-send-money", on: "left" },
                buttons: [
                    { classes: "shepherd-button-secondary", text: "Atrás", action: back },
                    { classes: "shepherd-button-primary", text: "Siguiente", action: next },
                ],
                title: "Enviar",
                text: "Envía USDC o tokens a cualquier dirección al instante.",
            },
            {
                id: "bridge-action",
                attachTo: { element: "#tour-bridge", on: "left" },
                buttons: [
                    { classes: "shepherd-button-secondary", text: "Atrás", action: back },
                    { classes: "shepherd-button-primary", text: "Siguiente", action: next },
                ],
                title: "Bridge",
                text: "Mueve activos entre chains (Base, Polygon, Stellar) sin complicaciones.",
            },
            {
                id: "wallet-copy",
                attachTo: { element: ".tour-copy-address", on: "bottom" },
                buttons: [
                    { classes: "shepherd-button-secondary", text: "Atrás", action: back },
                    { classes: "shepherd-button-primary", text: "Siguiente", action: next },
                ],
                title: "Copiar Address",
                text: "Haz click aquí para copiar tu dirección y compartirla para recibir fondos.",
            },
            {
                id: "wallet-delete",
                attachTo: { element: ".tour-delete-wallet", on: "left" },
                buttons: [
                    { classes: "shepherd-button-secondary", text: "Atrás", action: back },
                    { classes: "shepherd-button-primary", text: "¡Listo!", action: next },
                ],
                title: "Gestión",
                text: "Si ya no necesitas ver esta wallet, puedes quitarla con el botón rojo.",
            }
        ];
    };


    // --- LAUNCHER LOGIC ---

    const startTour = (type: "INTRO" | "WALLET") => {
        console.log(`Starting Tour Phase: ${type}`);

        if (tourRef.current) {
            tourRef.current.cancel();
        }

        // @ts-ignore
        const newTour = new Shepherd.Tour({
            ...tourOptions,
        });

        const steps = type === "INTRO" ? getIntroSteps(newTour) : getWalletSteps(newTour);
        // @ts-ignore
        newTour.addSteps(steps);

        const markSeen = () => {
            console.log(`Phase ${type} completed.`);
            localStorage.setItem(type === "INTRO" ? KEY_INTRO : KEY_WALLET, "true");
        };

        newTour.on("complete", markSeen);
        newTour.on("cancel", markSeen);

        tourRef.current = newTour;
        newTour.start();
    };

    useEffect(() => {
        if (typeof window === "undefined") return;

        const seenIntro = localStorage.getItem(KEY_INTRO);
        const seenWallet = localStorage.getItem(KEY_WALLET);

        console.log(`Tour Check v12: Intro=${seenIntro}, WalletTour=${seenWallet}, HasWallets=${hasWallets}`);

        // Scenarios:

        // 1. Initial Intro (No previous intro seen)
        if (!seenIntro) {
            const timer = setTimeout(() => startTour("INTRO"), 500);
            return () => clearTimeout(timer);
        }

        // 2. Wallet Tour (Seen intro, has wallets, but hasn't seen wallet tour)
        // This triggers when user adds their first wallet OR if they are an old user logging in
        if (seenIntro && hasWallets && !seenWallet) {
            const timer = setTimeout(() => startTour("WALLET"), 500);
            return () => clearTimeout(timer);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasWallets]); // Reacts to wallet changes!

    return null;
}
