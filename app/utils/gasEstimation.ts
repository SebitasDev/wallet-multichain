// utils/circleBridge.ts
import { BridgeKit, BridgeParams } from "@circle-fin/bridge-kit";
import { createAdapterFromPrivateKey } from "@circle-fin/adapter-viem-v2";

/*if (!process.env.PRIVATE_KEY) {
    throw new Error("Missing PRIVATE_KEY");
}*/

const kit = new BridgeKit();

// Reusable adapter
export const circleAdapter = createAdapterFromPrivateKey({
    privateKey: "0xea85b089b693c58e262d2a1fd35d8f8f4566db40968a80070a90786566c10c4c"//process.env.PRIVATE_KEY,
});

/**
 * Estimate CCTP bridge fees
 */
export async function estimateBridge(params: BridgeParams) {
    try {
        const estimate = await kit.estimate(params);

        const providerFee = estimate.fees.find(f => f.type === "provider")?.amount;

        return {
            ok: true,
            estimate,
            providerFee: providerFee ?? null,
        };
    } catch (error) {
        console.error("❌ Error estimating bridge:", error);
        return { ok: false, error };
    }
}

/**
 * Perform the actual bridge
 */
export async function executeBridge(params: BridgeParams) {
    try {
        const res = await kit.bridge(params);
        return { ok: true, result: res };
    } catch (error) {
        return { ok: false, error };
    }
}

/**
 * Combined estimate + conditional execution
 */
export async function estimateAndBridge(params: BridgeParams) {
    const est = await estimateBridge(params);

    if (!est.ok) return est;

    const providerFee = est.providerFee;

    // Only proceed if provider fee < 0.1 USDC (or null/undefined)
    if (providerFee != null && parseFloat(providerFee) >= 0.1) {
        return {
            ok: false,
            reason: "Provider fee too high",
            providerFee,
        };
    }

    // Otherwise run the bridge
    return await executeBridge(params);
}

/**
 * Shortcut example: Base → Ethereum
 */
export async function estimateBaseToEthereum(amount: string) {
    return estimateBridge({
        from: { adapter: circleAdapter, chain: "Base_Sepolia" },
        to: { adapter: circleAdapter, chain: "Ethereum_Sepolia" },
        amount,
    });
}
