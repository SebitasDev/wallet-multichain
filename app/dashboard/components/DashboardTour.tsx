"use client";

import { useEffect, useRef, useMemo } from "react";
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

    const STORAGE_KEY = "hasSeenOnboarding_v4"; // Bumped to v4 for new logic

    // Define steps dynamically based on state
    const getSteps = (tour: Tour) => {
        const baseSteps = [
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
                    {
                        classes: "shepherd-button-primary",
                        text: "¡Vamos!",
                        action: tour.next,
                    },
                ],
                cancelIcon: { enabled: true },
                title: "🚀 ¡Bienvenido a 1LLET!",
                text: "Estás ante la billetera más rápida y rebelde de la Web3. ¿Listo para el tour?",
            }
        ];

        if (!hasWallets) {
            // FLOW A: User Sigue Sin Wallet (New User)
            return [
                ...baseSteps,
                {
                    id: "generate-wallet",
                    attachTo: { element: "#tour-generate-wallet", on: "top" },
                    buttons: [
                        { classes: "shepherd-button-secondary", text: "Atrás", action: tour.back },
                        { classes: "shepherd-button-primary", text: "Siguiente", action: tour.next },
                    ],
                    title: "1. Crea tu Identidad",
                    text: "No existes en la blockchain hasta que tienes una wallet. Genera una dirección multichain única en un clic.",
                },
                {
                    id: "profile-intro",
                    attachTo: { element: "#tour-profile", on: "left" },
                    buttons: [
                        { classes: "shepherd-button-secondary", text: "Atrás", action: tour.back },
                        { classes: "shepherd-button-primary", text: "Siguiente", action: tour.next },
                    ],
                    title: "2. Tu Nivel de Degen",
                    text: "Aquí verás tus estadísticas, medallas y APY promedio. ¡Sube de nivel usando la app!",
                },
                {
                    id: "ctf-teaser",
                    attachTo: { element: "#tour-action-ctf", on: "bottom" },
                    buttons: [
                        { classes: "shepherd-button-secondary", text: "Atrás", action: tour.back },
                        { classes: "shepherd-button-primary", text: "Finalizar", action: tour.next },
                    ],
                    title: "3. Capture The Flag",
                    text: "Para los hackers: completa retos en modo CTF y gana recompensas reales. Pero primero, ¡genera esa wallet!",
                }
            ];
        } else {
            // FLOW B: Power User (Has Wallets)
            return [
                ...baseSteps,
                {
                    id: "hub-intro",
                    attachTo: { element: "#main-wallet-actions", on: "right" },
                    buttons: [
                        { classes: "shepherd-button-secondary", text: "Atrás", action: tour.back },
                        { classes: "shepherd-button-primary", text: "Siguiente", action: tour.next },
                    ],
                    title: "🔥 Tu Centro de Mando",
                    text: "Desde aquí controlas todo: Generar nuevas keys, Enviar crypto y realizar Puentes entre blockchains.",
                },
                {
                    id: "send-action",
                    attachTo: { element: "#tour-send-money", on: "left" },
                    buttons: [
                        { classes: "shepherd-button-secondary", text: "Atrás", action: tour.back },
                        { classes: "shepherd-button-primary", text: "Siguiente", action: tour.next },
                    ],
                    title: "Enviar es Fácil",
                    text: "Olvídate de comisiones ocultas. Envía USDC o tokens nativos a cualquier dirección instantáneamente.",
                },
                {
                    id: "bridge-action",
                    attachTo: { element: "#tour-bridge", on: "left" },
                    buttons: [
                        { classes: "shepherd-button-secondary", text: "Atrás", action: tour.back },
                        { classes: "shepherd-button-primary", text: "Siguiente", action: tour.next },
                    ],
                    title: "Bridge Sin Dolor",
                    text: "¿Tienes fondos en Polygon y los quieres en Base? Usa nuestro Bridge y se mueven en segundos.",
                },
                {
                    id: "top-actions-receive",
                    attachTo: { element: "#tour-action-receive", on: "bottom" },
                    buttons: [
                        { classes: "shepherd-button-secondary", text: "Atrás", action: tour.back },
                        { classes: "shepherd-button-primary", text: "Siguiente", action: tour.next },
                    ],
                    title: "Recibe Pagos",
                    text: "Comparte tu QR o dirección pública para recibir depósitos de cualquiera.",
                },
                {
                    id: "wallets-list",
                    attachTo: { element: "#wallets-list", on: "top" },
                    buttons: [
                        { classes: "shepherd-button-secondary", text: "Atrás", action: tour.back },
                        { classes: "shepherd-button-primary", text: "Siguiente", action: tour.next },
                    ],
                    title: "Tus Billeteras",
                    text: "Tu colección de addresses. Desliza para verlas todas. Cada tarjeta es una cuenta independiente.",
                },
                {
                    id: "wallet-copy",
                    attachTo: { element: ".tour-copy-address", on: "bottom" },
                    buttons: [
                        { classes: "shepherd-button-secondary", text: "Atrás", action: tour.back },
                        { classes: "shepherd-button-primary", text: "¡A darle!", action: tour.next },
                    ],
                    title: "Copiar Rápido",
                    text: "Usa este botón para copiar tu dirección al portapapeles al instante. ¡Sin rodeos!",
                }
            ];
        }
    };

    useEffect(() => {
        if (typeof window === "undefined") return;

        // Check if user has seen the tour
        const hasSeenTour = localStorage.getItem(STORAGE_KEY);

        // Always initialize/re-initialize if not seen (or if state changed significantly, though we want to respect 'seen')
        // Ideally, if a user generates a wallet, they might move to Flow B? 
        // For now, let's just stick to "If they haven't finished a tour, show the relevant one".

        if (!hasSeenTour) {
            startTour();
        }

        return () => {
            if (tourRef.current && tourRef.current.isActive()) {
                tourRef.current.cancel();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasWallets]); // Re-run if wallet state changes significantly (e.g. they add a wallet)

    const startTour = () => {
        if (tourRef.current) {
            tourRef.current.cancel(); // Cancel existing if any
        }

        // @ts-ignore -- Shepherd type compatibility
        tourRef.current = new Shepherd.Tour({
            ...tourOptions,
        });

        const tour = tourRef.current;

        // Add steps after creation so we can bind 'tour' actions
        tour.addSteps(getSteps(tour));

        const markSeen = () => {
            localStorage.setItem(STORAGE_KEY, "true");
        };

        tour.on("complete", markSeen);
        tour.on("cancel", markSeen);

        // Slight delay to ensure DOM is ready
        setTimeout(() => {
            if (!tour.isActive()) {
                tour.start();
            }
        }, 1000);
    };

    return null; // Hidden component (logic only)
}
