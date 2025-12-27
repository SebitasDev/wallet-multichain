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
    const KEY_COMMON_TOUR = "hasSeenCommonOnboarding_v3";

    // --- STEP DEFINITIONS ---
    const getSteps = (tour: Tour) => {
        const next = () => tour.next();
        const back = () => tour.back();

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
                    { classes: "shepherd-button-primary", text: "¡Hola!", action: next },
                ],
                cancelIcon: { enabled: true },
                title: "👋 ¡Hola! Tu Billetera Fácil",
                text: "Olvídate de lo complicado. Esta billetera está diseñada para que manejes tu dinero digital tan fácil como enviar un mensaje. Vamos a darte un tour súper rápido.",
            },
            {
                id: "balance",
                attachTo: { element: "#common-balance-card", on: "bottom" },
                buttons: [
                    { classes: "shepherd-button-secondary", text: "Atrás", action: back },
                    { classes: "shepherd-button-primary", text: "Entendido", action: next },
                ],
                title: "💰 Tu Dinero Total",
                text: "Aquí ves cuánto dinero tienes disponible. Es como el saldo de tu banco. Si tocas la tarjeta, verás el detalle de tus monedas (como Dólares digitales o Pesos).",
            },
            {
                id: "actions",
                attachTo: { element: "#common-actions", on: "top" },
                buttons: [
                    { classes: "shepherd-button-secondary", text: "Atrás", action: back },
                    { classes: "shepherd-button-primary", text: "Siguiente", action: next },
                ],
                title: "✨ Tus 3 Botones Mágicos",
                text: "Aquí sucede la magia:\n• <b>Recibir:</b> Muestra tu código para que te depositen dinero.\n• <b>Swap:</b> Cambia una moneda por otra al instante.\n• <b>Enviar:</b> Págale a un amigo o manda plata a otra cuenta.",
            },
            {
                id: "transactions",
                attachTo: { element: "#common-transactions", on: "top" },
                buttons: [
                    { classes: "shepherd-button-secondary", text: "Atrás", action: back },
                    { classes: "shepherd-button-primary", text: "Siguiente", action: next },
                ],
                title: "📅 Tus Movimientos",
                text: "Aquí verás todo lo que entra y sale. Si alguien te paga, aparecerá aquí enseguida. Si compras algo, también. ¡Control total!",
            },
            {
                id: "navigation",
                attachTo: { element: "#common-navigation", on: "right" },
                buttons: [
                    { classes: "shepherd-button-secondary", text: "Atrás", action: back },
                    { classes: "shepherd-button-primary", text: "¡Listo!", action: next },
                ],
                title: "🧭 Menú Principal",
                text: "Usa este menú para ver tus Tarjetas, pagar servicios o salir de la cuenta. ¡Eso es todo! Ya estás listo para usar tu dinero libremente.",
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

    return null;
}
