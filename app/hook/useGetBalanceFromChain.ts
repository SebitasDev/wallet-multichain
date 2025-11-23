import { useEffect, useState } from "react";
import {
    createPublicClient,
    http,
    formatUnits,
    erc20Abi
} from "viem";
import { Address } from "abitype";

export const useGetBalanceFromChain = (
    chain: any,
    address: Address,
    tokenAddress: Address
) => {
    const [balance, setBalance] = useState<string>("0");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!address || !tokenAddress || !chain) return;

        const client = createPublicClient({
            chain,
            transport: http(),
        });

        const fetchBalance = async () => {
            try {
                setLoading(true);

                const decimals = await client.readContract({
                    address: tokenAddress,
                    abi: erc20Abi,
                    functionName: "decimals",
                });

                const raw = await client.readContract({
                    address: tokenAddress,
                    abi: erc20Abi,
                    functionName: "balanceOf",
                    args: [address],
                });

                setBalance(formatUnits(raw, decimals));
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBalance();
    }, [chain, address, tokenAddress]);


    return {
        balance,
        loading,
        error,
    };
};
