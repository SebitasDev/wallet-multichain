// components/PremiumAccessButton.tsx
"use client";

import { Button } from "@mui/material";
import { useX402Payment } from "@/app/hook/useX402Payment";

export const PremiumAccessButton = () => {
    const { payForPremium } = useX402Payment(); // Hook seguro porque estamos dentro del provider

    return (
        <Button variant="contained" color="primary" onClick={payForPremium}>
            Acceder a Premium
        </Button>
    );
};
