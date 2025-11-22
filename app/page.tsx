"use client";

import { useState } from "react";

export default function Home() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleBridge = async () => {
        setLoading(true);

        try {
            const res = await fetch("/api/bridge-usdc", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: "1.00",
                    fromChain: "Base_Sepolia",
                    toChain: "Optimism_Sepolia",
                    recipient: "0x01e048f8450e6ff1bf0e356ec78a4618d9219770",
                    privateKey: "0xc394f278899f1075bb2005528b25eea7ffde6c382e765bae73ab6bc956dbfd7b"
                }),
            });

            const json = await res.json();
            setResult(json);
        } catch (err) {
            console.error("Bridge failed:", err);
        }

        setLoading(false);
    };

    return (
        <div>
            <button onClick={handleBridge} disabled={loading}>
                {loading ? "Bridgeando..." : "Bridge USDC"}
            </button>

            {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
        </div>
    );
}
