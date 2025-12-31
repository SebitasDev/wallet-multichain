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

export function CommonDashboardTour() {
    const tourRef = useRef<Tour | null>(null);

    // Key to prevent showing the tour multiple times
    const KEY_COMMON_TOUR = "hasSeenCommonOnboarding_v8";

    // --- CUSTOM STYLES ---
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

        return [
            {
                id: "welcome",
                attachTo: { element: "#common-wallet-btn", on: "right" },
                beforeShowPromise: function () {
                    return new Promise<void>(function (resolve) {
                        setTimeout(function () {
                            window.scrollTo(0, 0);
                            resolve();
                        }, 500);
                    });
                },
                buttons: [
                    { classes: "shepherd-button-primary", text: "Empezar", action: next },
                ],
                cancelIcon: { enabled: true },
                title: "Tu Billetera, Simplificada",
                text: "Bienvenido a una nueva forma de manejar tu dinero. Simple, rápido y seguro.",
            },
            {
                id: "balance",
                attachTo: { element: "#common-balance-card", on: "bottom" },
                buttons: [
                    { classes: "shepherd-button-secondary", text: "Atrás", action: back },
                    { classes: "shepherd-button-primary", text: "Siguiente", action: next },
                ],
                title: "Tu Balance Total",
                text: "Todo tu dinero en un solo lugar. Toca para ver el detalle de tus monedas.",
            },
            {
                id: "receive-action",
                attachTo: { element: "#common-action-receive", on: "bottom" },
                buttons: [
                    { classes: "shepherd-button-secondary", text: "Atrás", action: back },
                    { classes: "shepherd-button-primary", text: "Siguiente", action: next },
                ],
                title: "Recibir Dinero",
                text: "Muestra tu código QR o copia tu dirección para recibir pagos al instante.",
            },
            {
                id: "swap-action",
                attachTo: { element: "#common-action-swap", on: "bottom" },
                buttons: [
                    { classes: "shepherd-button-secondary", text: "Atrás", action: back },
                    { classes: "shepherd-button-primary", text: "Siguiente", action: next },
                ],
                title: "Cambio Rápido",
                text: "Cambia entre monedas en segundos. De Pesos a Dólares, sin complicaciones.",
            },
            {
                id: "send-action",
                attachTo: { element: "#common-action-send", on: "bottom" },
                buttons: [
                    { classes: "shepherd-button-secondary", text: "Atrás", action: back },
                    { classes: "shepherd-button-primary", text: "Siguiente", action: next },
                ],
                title: "Enviar Dinero",
                text: "Envía dinero a amigos o comercios. Rápido y con bajas comisiones.",
            },
            {
                id: "transactions",
                attachTo: { element: "#common-transactions", on: "top" },
                buttons: [
                    { classes: "shepherd-button-secondary", text: "Atrás", action: back },
                    { classes: "shepherd-button-primary", text: "Siguiente", action: next },
                ],
                title: "Tus Movimientos",
                text: "Mantén el control. Revisa en tiempo real todo lo que entra y sale.",
            },
            {
                id: "navigation",
                attachTo: { element: "#common-navigation", on: "right" },
                buttons: [
                    { classes: "shepherd-button-secondary", text: "Atrás", action: back },
                    { classes: "shepherd-button-primary", text: "Listo", action: finish },
                ],
                title: "Más Opciones",
                text: "Accede a tus tarjetas, configuración y más desde este menú.",
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
            localStorage.setItem(KEY_COMMON_TOUR, "true");
        };

        newTour.on("complete", markSeen);
        newTour.on("cancel", markSeen);

        tourRef.current = newTour;
        newTour.start();
    };

    useEffect(() => {
        if (typeof window === "undefined") return;

        const seenTour = localStorage.getItem(KEY_COMMON_TOUR);

        if (!seenTour) {
            const timer = setTimeout(() => startTour(), 1000); // Wait a bit for UI to load
            return () => clearTimeout(timer);
        }
    }, []);

    return (
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
    );
}
