"use client";

import { useEffect, useRef } from "react";
import Shepherd, { Tour } from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";

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

export function CommonSwapTour({ isSingleChain = false }: { isSingleChain?: boolean }) {
    const tourRef = useRef<Tour | null>(null);

    // Key to prevent showing the tour multiple times
    // Differentiate between global swap tour and single-chain specific tour
    const KEY_SWAP_TOUR = isSingleChain ? "hasSeenSingleChainSwap_v1" : "hasSeenSwapOnboarding_v2";

    // --- CUSTOM STYLES (Duplicated for isolation) ---
    const globalStyles = `
        .shepherd-element {
            border-radius: 20px !important;
            background: #ffffff !important;
            box-shadow: 0 10px 40px -10px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05) !important;
            border: none !important;
            font-family: 'Inter', system-ui, sans-serif !important;
            max-width: 380px !important;
            padding: 0 !important;
            overflow: hidden !important;
            z-index: 9999 !important; /* Ensure it's above modal */
        }
        .shepherd-header {
            background: transparent !important;
            padding: 24px 24px 0 24px !important;
            border: none !important;
        }
        .shepherd-title {
            font-size: 1.1rem !important;
            font-weight: 700 !important;
            color: #111 !important;
            line-height: 1.3 !important;
            margin: 0 !important;
        }
        .shepherd-text {
            font-size: 0.95rem !important;
            color: #666 !important;
            line-height: 1.5 !important;
            padding: 12px 24px 24px 24px !important;
        }
        .shepherd-footer {
            padding: 0 24px 24px 24px !important;
            border: none !important;
            display: flex !important;
            justify-content: flex-end !important;
            gap: 12px !important;
        }
        .shepherd-button {
            border-radius: 12px !important;
            font-weight: 600 !important;
            font-size: 0.9rem !important;
            padding: 10px 20px !important;
            transition: all 0.2s ease !important;
            margin: 0 !important;
        }
        .shepherd-button-primary {
            background: #111 !important;
            color: #fff !important;
        }
        .shepherd-button-primary:hover {
            background: #333 !important;
            transform: translateY(-1px);
        }
        .shepherd-button-secondary {
            background: transparent !important;
            color: #666 !important;
        }
        .shepherd-button-secondary:hover {
            color: #111 !important;
            background: #f5f5f5 !important;
        }
        .shepherd-arrow:before {
            background: #ffffff !important;
        }
    `;

    // --- STEP DEFINITIONS ---
    const getSteps = (tour: Tour) => {
        const next = () => tour.next();
        const back = () => tour.back();
        const finish = () => tour.complete();

        if (isSingleChain) {
            return [
                {
                    id: "single-swap-intro",
                    beforeShowPromise: function () {
                        return new Promise<void>(function (resolve) {
                            setTimeout(function () {
                                resolve();
                            }, 500);
                        });
                    },
                    buttons: [
                        { classes: "shepherd-button-primary", text: "Entendido", action: next },
                    ],
                    cancelIcon: { enabled: true },
                    title: "Cambio Local (Misma Red)",
                    text: "Estás haciendo un cambio dentro de la misma red.",
                },
                {
                    id: "single-swap-source",
                    attachTo: { element: "#swap-source-section", on: "right" },
                    buttons: [
                        { classes: "shepherd-button-secondary", text: "Atrás", action: back },
                        { classes: "shepherd-button-primary", text: "Siguiente", action: next },
                    ],
                    title: "Tu Moneda Actual",
                    text: "Elige el token de origen en esta red.",
                },
                {
                    id: "single-swap-dest",
                    attachTo: { element: "#swap-dest-section", on: "right" },
                    buttons: [
                        { classes: "shepherd-button-secondary", text: "Atrás", action: back },
                        { classes: "shepherd-button-primary", text: "Siguiente", action: next },
                    ],
                    title: "Moneda a Recibir",
                    text: "Elige el token que recibirás (en la misma red).",
                },
                {
                    id: "single-swap-recipient",
                    attachTo: { element: "#swap-recipient-toggle", on: "top" },
                    buttons: [
                        { classes: "shepherd-button-secondary", text: "Atrás", action: back },
                        { classes: "shepherd-button-primary", text: "Siguiente", action: next },
                    ],
                    title: "Enviar a otra dirección",
                    text: "Si quieres enviar el resultado a OTRA dirección (billetera), activa esta opción.",
                },
                {
                    id: "single-swap-submit",
                    attachTo: { element: "#swap-submit-btn", on: "top" },
                    buttons: [
                        { classes: "shepherd-button-secondary", text: "Atrás", action: back },
                        { classes: "shepherd-button-primary", text: "Confirmar", action: finish },
                    ],
                    title: "Confirmar",
                    text: "Confirma tu operación.",
                }
            ];
        }

        return [
            {
                id: "swap-intro",
                // Centered if no attachTo
                beforeShowPromise: function () {
                    return new Promise<void>(function (resolve) {
                        setTimeout(function () {
                            resolve();
                        }, 500);
                    });
                },
                buttons: [
                    { classes: "shepherd-button-primary", text: "Ver cómo funciona", action: next },
                ],
                cancelIcon: { enabled: true },
                title: "Cambios Simples",
                text: "Intercambia tus monedas de forma rápida, segura y con las mejores tasas del mercado.",
            },
            {
                id: "swap-source",
                attachTo: { element: "#swap-source-section", on: "right" },
                buttons: [
                    { classes: "shepherd-button-secondary", text: "Atrás", action: back },
                    { classes: "shepherd-button-primary", text: "Siguiente", action: next },
                ],
                title: "Tu Origen",
                text: "Elige la red (Chain) y la moneda que quieres cambiar, además del monto.",
            },
            {
                id: "swap-dest",
                attachTo: { element: "#swap-dest-section", on: "right" },
                buttons: [
                    { classes: "shepherd-button-secondary", text: "Atrás", action: back },
                    { classes: "shepherd-button-primary", text: "Siguiente", action: next },
                ],
                title: "Tu Destino",
                text: "Elige también la red y la moneda que quieres recibir.",
            },
            {
                id: "swap-recipient",
                attachTo: { element: "#swap-recipient-toggle", on: "top" },
                buttons: [
                    { classes: "shepherd-button-secondary", text: "Atrás", action: back },
                    { classes: "shepherd-button-primary", text: "Siguiente", action: next },
                ],
                title: "Mandar a otro lado",
                text: "Activa esto si quieres que las monedas nuevas vayan directo a otra dirección (otra billetera).",
            },
            {
                id: "swap-submit",
                attachTo: { element: "#swap-submit-btn", on: "top" },
                buttons: [
                    { classes: "shepherd-button-secondary", text: "Atrás", action: back },
                    { classes: "shepherd-button-primary", text: "Entendido", action: finish },
                ],
                title: "Confirmar",
                text: "Revisa la cotización y confirma el cambio con un clic. ¡Así de fácil!",
            }
        ];
    };

    // --- LAUNCHER LOGIC ---

    const startTour = () => {
        if (tourRef.current) {
            tourRef.current.cancel();
        }

        // @ts-ignore
        const newTour = new Shepherd.Tour({
            ...tourOptions,
        });

        const steps = getSteps(newTour);
        // @ts-ignore
        newTour.addSteps(steps);

        const markSeen = () => {
            localStorage.setItem(KEY_SWAP_TOUR, "true");
        };

        newTour.on("complete", markSeen);
        newTour.on("cancel", markSeen);

        tourRef.current = newTour;
        newTour.start();
    };

    useEffect(() => {
        if (typeof window === "undefined") return;

        // Check if user has seen swap tour
        const seenTour = localStorage.getItem(KEY_SWAP_TOUR);

        // We also want to make sure we don't conflict with the main dashboard tour if it's running?
        // Shepherd manages singleton usually, but let's just trigger it.
        // It's inside the modal, so it mounts when modal opens.

        if (!seenTour) {
            const timer = setTimeout(() => startTour(), 800); // Wait for modal animation
            return () => clearTimeout(timer);
        }
    }, []);

    return (
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
    );
}
