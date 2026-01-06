import { useState, useEffect, useMemo } from "react";
import { Address } from "abitype";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { STELLAR } from "@/app/constants/chains/NoEvm/Stellar";
import { getBalanceFromChain } from "@/app/hooks/useGetBalanceFromChain";
import { getStellarUSDCBalance } from "@/app/lib/stellar/getStellarUSDCBalance";

export const STELLAR_CHAIN_KEY = "Stellar";

export const useMaxTransferAmount = (
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
        if (process.env.NEXT_PUBLIC_ENVIROMENT === "development" || process.env.NODE_ENV === "development") return 0;

        let feeVal = 0.02; // Default Cross-chain
        if (sourceChain === destChain) {
            feeVal = sourceToken !== destToken ? 0.02 : 0.01;
        }
        return feeVal;
    }, [sourceChain, destChain, sourceToken, destToken]);

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
                    if (isNative) {
                        try {
                            const { createPublicClient, http, formatEther } = await import("viem");

                            const publicClient = createPublicClient({
                                chain: networkConfig.evm.chain,
                                transport: http()
                            });

                            const gasPrice = await publicClient.getGasPrice();
                            // Estimate transfer to Facilitator
                            // 0 value is safest for pure gas estimation of the call.
                            const FACILITATOR_ADDR = "0xa08979ba1aac1c19dc659817c295c77018533a97";

                            const gasEstimate = await publicClient.estimateGas({
                                account: address as Address,
                                to: FACILITATOR_ADDR as Address,
                                value: BigInt(0)
                            });

                            const gasCost = gasEstimate * gasPrice;
                            const gasCostWithBuffer = (gasCost * BigInt(110)) / BigInt(100); // +10%

                            GAS_BUFFER = parseFloat(formatEther(gasCostWithBuffer));
                        } catch (e) {
                            console.warn("Gas estimation failed, using fallback 0.005", e);
                            GAS_BUFFER = 0.005;
                        }
                    }

                    const max = numBalance - expectedFee - GAS_BUFFER;

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
