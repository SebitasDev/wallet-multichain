// hooks/useX402Payment.ts
"use client";

import { useXOContracts } from "@/app/dashboard/hooks/useXOConnect";
import { toast } from "react-toastify";
import { paymentMiddleware } from "x402-next";

export const useX402Payment = () => {
    const { address, client } = useXOContracts();

    const payForPremium = async () => {
        if (!address) {
            toast.error("Wallet no conectada");
            return;
        }

        try {
            // Aquí definimos la configuración de X402
            const middleware = paymentMiddleware(
                "0x0b00a75637601e0F1B98d7B79b28A77c1f64E16D",
                {
                    "/premium": {
                        price: "$0.01",
                        network: "base-sepolia",
                        config: { description: "Acceso Premium" },
                    },
                },
                {
                    url: "https://facilitator.ultravioletadao.xyz",
                }
            );

            // Esto normalmente se activa como middleware de ruta,
            // pero si quieres desde botón, puedes usar la API de X402
            // para crear la operación de pago aquí usando tu `address` y `client`.
            toast.info("Redirigiendo a pago X402...");
        } catch (err) {
            console.error("Error pagando con X402:", err);
            toast.error("Error al procesar pago");
        }
    };

    return { payForPremium };
};
