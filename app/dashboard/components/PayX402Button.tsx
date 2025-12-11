"use client";

import { useState } from "react";
import { Button, CircularProgress } from "@mui/material";
import { toast } from "react-toastify";
import { useXOContracts } from "@/app/dashboard/hooks/useXOConnect";

// Address de prueba para recibir el pago
const TEST_RECIPIENT = "0x1234567890123456789012345678901234567890";
const TEST_AMOUNT = "0.001"; // $0.01 USDC

export const PayX402Button = () => {
    const [loading, setLoading] = useState(false);
    const { payX402, address } = useXOContracts();

    const handlePayX402 = async () => {
        if (!address) {
            toast.error("No hay wallet conectada");
            return;
        }

        setLoading(true);
        toast.info("Procesando pago x402...");

        try {
            const result = await payX402(TEST_AMOUNT, TEST_RECIPIENT);

            if (result.success) {
                toast.success(`Pago exitoso! TX: ${result.txHash?.slice(0, 10)}...`);
            } else {
                toast.error(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error("Error en pago x402:", error);
            toast.error("Error al procesar el pago");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="contained"
            onClick={handlePayX402}
            disabled={loading || !address}
            sx={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                color: "white",
                fontWeight: 600,
                px: 3,
                py: 1.5,
                borderRadius: 2,
                textTransform: "none",
                "&:hover": {
                    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                },
                "&:disabled": {
                    background: "#4b5563",
                    color: "#9ca3af",
                },
            }}
        >
            {loading ? (
                <>
                    <CircularProgress size={20} sx={{ color: "white", mr: 1 }} />
                    Procesando...
                </>
            ) : (
                "Pagar x402 ($0.01)"
            )}
        </Button>
    );
};
