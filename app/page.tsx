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
