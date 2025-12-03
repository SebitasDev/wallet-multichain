import {Address} from "abitype";
import {arbitrumSepolia, baseSepolia, optimismSepolia, unichainSepolia} from "viem/chains";
import {useGetBalanceFromChain} from "@/app/hook/useGetBalanceFromChain";
import {useEffect, useState} from "react";
import {useBalanceStore} from "@/app/store/useBalanceStore";
import {useWalletsInfoStore} from "@/app/store/useWalletsInfoStore";

export const useAddressInfo = (address: Address) => {
    const { balance: baseBalance, loading: baseLoading } =
        useGetBalanceFromChain(baseSepolia, address, "0x036CbD53842c5426634e7929541eC2318f3dCF7e");

    const { balance: arbitrumBalance, loading: arbitrumLoading } =
        useGetBalanceFromChain(arbitrumSepolia, address, "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d");

    const { balance: optimismBalance, loading: optimismLoading } =
        useGetBalanceFromChain(optimismSepolia, address, "0x5fd84259d66Cd46123540766Be93DFE6D43130D7");

    const { balance: unichainBalance, loading: unichainLoading } =
        useGetBalanceFromChain(unichainSepolia, address, "0x31d0220469e10c4E71834a79b1f276d740d3768F");


    const [total, setTotal] = useState("0");

    const { increment } = useBalanceStore();
    const { addWalletInfo } = useWalletsInfoStore();

    useEffect(() => {
        // Ejecutar solo cuando TODOS terminaron de cargar
        const allLoaded =
            !baseLoading &&
            !arbitrumLoading &&
            !optimismLoading &&
            !unichainLoading ;

        if (!allLoaded) return;

        const sum =
            Number(baseBalance) +
            Number(arbitrumBalance) +
            Number(optimismBalance) +
            Number(unichainBalance);

        setTotal(sum.toString());
        increment(sum);

        addWalletInfo({
            address: address,
            totalAmount: sum,
            chains: [
                { chainId: baseSepolia.id.toString(), chainAmount: Number(baseBalance) },
                { chainId: arbitrumSepolia.id.toString(), chainAmount: Number(arbitrumBalance) },
                { chainId: optimismSepolia.id.toString(), chainAmount: Number(optimismBalance) },
                { chainId: unichainSepolia.id.toString(), chainAmount: Number(unichainBalance) },
            ]
        });

    }, [baseLoading, arbitrumLoading, optimismLoading, unichainLoading]);

    return {
        baseBalance,
        arbitrumBalance,
        optimismBalance,
        unichainBalance,
        total,
    };
}