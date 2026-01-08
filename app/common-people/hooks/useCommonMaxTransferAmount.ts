
import { useState, useEffect, useMemo } from "react";
import { Address } from "abitype";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { STELLAR } from "@/app/constants/chains/NoEvm/Stellar";
import { getBalanceFromChain } from "@/app/hooks/useGetBalanceFromChain";
import { getStellarUSDCBalance } from "@/app/lib/stellar/getStellarUSDCBalance";

export const STELLAR_CHAIN_KEY = "Stellar";

// CLONE of useMaxTransferAmount aimed at Common People
// DIFFERENCE: Removes artificial 0.01 fee for Intra-Chain transfers to allow full balance withdrawal.
export const useCommonMaxTransferAmount = (
    address: string | undefined | null,
    sourceChain: string,
    destChain: string,
    sourceToken: string,
    destToken: string,
    stellarPrivateKey: string | null,
    chains: any[] = []
) => {
    const [maxAmount, setMaxAmount] = useState(0);
    const [balance, setBalance] = useState(0);

    // Calculate expected fee for Max calc (independent of amount entered)
    const expectedFee = useMemo(() => {
        // ALWAYS return 0 for Common People Intra-Chain to allow full usage.
        // We assume Gas is paid in Native Token (MATIC/ETH) so USDC max = USDC balance.
        // For Cross-Chain, we keep the default 0.02 safety or similar, 
        // OR we can make it 0 if we rely on backend accurate quotes.
        // Let's keep strict behavior specifically for "Same Chain".

        if (sourceChain === destChain) {
            return 0; // ZERO FEE for Intra-Chain
        }

        // Cross-Chain logic (Keep original behavior or relax it?)
        // Original was 0.02. Let's keep 0.02 for Cross-Chain safety buffer.
        return 0.02;
    }, [sourceChain, destChain]);

    useEffect(() => {
        let isMounted = true;

        const fetchBalance = async () => {
            if (!address) {
                if (isMounted) {
                    setMaxAmount(0);
                    setBalance(0);
                }
                return;
            }

            // Stellar Cache Check
            if (sourceChain === STELLAR_CHAIN_KEY) {
                const stellarChain = chains.find(c => c.chainId === "stellar");
                if (stellarChain) {
                    const cachedVal = stellarChain.tokens?.[sourceToken === "XLM" ? "XLM" : "USDC"];

                    if (typeof cachedVal === "number") {
                        const reserve = sourceToken === "XLM" ? 1.1 : 0;
                        const max = cachedVal - reserve - expectedFee;
                        if (isMounted) {
                            setBalance(cachedVal);
                            const safeMax = Math.floor(max * 1_000_000) / 1_000_000;
                            setMaxAmount(safeMax > 0 ? safeMax : 0);
                        }
                        return; // Found in cache, return early!
                    }
                }
            }

            // EVM Cache Check
            const networkConfig = NETWORKS[sourceChain as keyof typeof NETWORKS];
            if (networkConfig?.evm) {
                const chainId = networkConfig.evm.chain.id.toString();
                const evmChain = chains.find(c => c.chainId === chainId);
                if (evmChain) {
                    const cachedVal = evmChain.tokens?.[sourceToken];
                    if (typeof cachedVal === "number") {
                        const asset = networkConfig.assets.find(a => a.name === sourceToken);
                        const isNative = asset?.address === "0x0000000000000000000000000000000000000000";
                        const GAS_BUFFER = isNative ? 0.005 : 0; // Simple fallback/buffer for cache

                        const max = cachedVal - expectedFee - GAS_BUFFER;
                        if (isMounted) {
                            setBalance(cachedVal);
                            const safeMax = Math.floor(max * 1_000_000) / 1_000_000;
                            setMaxAmount(safeMax > 0 ? safeMax : 0);
                        }
                        return; // Found in cache
                    }
                }
            }


            // Stellar Logic (Fallback to Fetch)
            if (sourceChain === STELLAR_CHAIN_KEY) {
                if (!stellarPrivateKey) {
                    if (isMounted) {
                        setMaxAmount(0);
                        setBalance(0);
                    }
                    return;
                }

                try {
                    const { Keypair } = await import("stellar-sdk");
                    const keypair = Keypair.fromSecret(stellarPrivateKey);
                    const publicKey = keypair.publicKey();

                    if (sourceToken === "XLM") {
                        const server = new (await import("stellar-sdk")).Horizon.Server("https://horizon.stellar.org");
                        const account = await server.loadAccount(publicKey);
                        const native = account.balances.find((b) => b.asset_type === "native");
                        const bal = native ? parseFloat(native.balance) : 0;
                        const max = bal - 1.1 - expectedFee;
                        if (isMounted) {
                            setBalance(bal);
                            const safeMax = Math.floor(max * 1_000_000) / 1_000_000;
                            setMaxAmount(safeMax > 0 ? safeMax : 0);
                        }
                    } else {
                        const bal = await getStellarUSDCBalance(publicKey);
                        if (bal !== null) {
                            const max = bal - expectedFee;
                            if (isMounted) {
                                setBalance(bal);
                                const safeMax = Math.floor(max * 1_000_000) / 1_000_000;
                                setMaxAmount(safeMax > 0 ? safeMax : 0);
                            }
                        } else {
                            if (isMounted) {
                                setMaxAmount(0);
                                setBalance(0);
                            }
                        }
                    }
                } catch (e) {
                    console.error("Error fetching Stellar balance:", e);
                    if (isMounted) {
                        setMaxAmount(0);
                        setBalance(0);
                    }
                }
                return;
            }

            // EVM Logic (Fallback)
            if (!networkConfig || !networkConfig.evm) {
                if (isMounted) {
                    setMaxAmount(0);
                    setBalance(0);
                }
                return;
            }

            const tokenName = sourceToken || "USDC";
            const assetInfo = networkConfig.assets.find(a => a.name === tokenName);
            const tokenAddress = assetInfo?.address;

            try {
                if (tokenAddress) {
                    const { balance: rawBal } = await getBalanceFromChain(
                        networkConfig.evm.chain,
                        address as Address,
                        tokenAddress as Address,
                        assetInfo?.decimals
                    );
                    const numBalance = Number(rawBal || 0);

                    // Check for Native Token (0x00...00)
                    const isNative = tokenAddress === "0x0000000000000000000000000000000000000000";

                    let GAS_BUFFER = 0;

                    // Logic: 
                    // 1. Intra-Chain ERC20 (USDC) -> Fee = 0.
                    // 2. Intra-Chain Native (POL/ETH) -> Fee = Gas Cost (21000 * GasPrice).
                    // 3. Cross-Chain -> Fee = 0.02 (Standard).

                    // Override expectedFee for Native Intra-Chain
                    const effectiveFee = (sourceChain === destChain && isNative) ? 0 : expectedFee;

                    if (isNative) {
                        try {
                            const { createPublicClient, http, formatEther } = await import("viem");

                            const publicClient = createPublicClient({
                                chain: networkConfig.evm.chain,
                                transport: http()
                            });

                            const gasPrice = await publicClient.getGasPrice();
                            // Standard transfer gas limit
                            const GAS_LIMIT = BigInt(21000);

                            const gasCost = GAS_LIMIT * gasPrice;

                            // Buffer: +10% to be safe
                            const gasCostWithBuffer = (gasCost * BigInt(110)) / BigInt(100);

                            GAS_BUFFER = parseFloat(formatEther(gasCostWithBuffer));
                        } catch (e) {
                            console.warn("Gas estimation failed, using fallback 0.005", e);
                            GAS_BUFFER = 0.005;
                        }
                    }

                    // For Native: Max = Balance - GasBuffer (Effective Fee is 0 if we count gas buffer as the fee)
                    // For ERC20: Max = Balance - EffectiveFee (0 for intra-chain)

                    // If isNative, we subtract GAS_BUFFER.
                    // If !isNative, we subtract effectiveFee.

                    const max = isNative
                        ? numBalance - GAS_BUFFER
                        : numBalance - effectiveFee;

                    if (isMounted) {
                        setBalance(numBalance);
                        const safeMax = Math.floor(max * 1_000_000) / 1_000_000;
                        setMaxAmount(safeMax > 0 ? safeMax : 0);
                    }
                }
            } catch (err) {
                console.error("Error fetching max amount:", err);
                if (isMounted) {
                    setMaxAmount(0);
                    setBalance(0);
                }
            }
        };

        fetchBalance();
        return () => { isMounted = false; };
    }, [address, sourceChain, destChain, sourceToken, destToken, stellarPrivateKey, expectedFee, chains]);

    return { maxAmount, balance };
};
