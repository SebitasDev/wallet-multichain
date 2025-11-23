import {Address} from "abitype";
import {baseSepolia, optimismSepolia, polygonAmoy} from "viem/chains";
import {useGetBalanceFromChain} from "@/app/hook/useGetBalanceFromChain";
import {useEffect, useState} from "react";
import {useBalanceStore} from "@/app/store/useBalanceStore";
import {useWalletsInfoStore} from "@/app/store/useWalletsInfoStore";

export const useAddressInfo = (address: Address) => {
    const { balance: baseBalance, loading: baseLoading } =
        useGetBalanceFromChain(baseSepolia, address, "0x036CbD53842c5426634e7929541eC2318f3dCF7e");

    const { balance: polygonBalance, loading: polygonLoading } =
        useGetBalanceFromChain(polygonAmoy, address, "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582");

    const { balance: optimismBalance, loading: optimismLoading } =
        useGetBalanceFromChain(optimismSepolia, address, "0x5fd84259d66Cd46123540766Be93DFE6D43130D7");

    const [total, setTotal] = useState("0");

    const { increment } = useBalanceStore();
    const { addWalletInfo } = useWalletsInfoStore();

    useEffect(() => {
        // Ejecutar solo cuando TODOS terminaron de cargar
        const allLoaded =
            !baseLoading &&
            !polygonLoading &&
            !optimismLoading;

        if (!allLoaded) return;

        const sum =
            Number(baseBalance) +
            Number(polygonBalance) +
            Number(optimismBalance);

        setTotal(sum.toString());
        increment(sum);

        addWalletInfo({
            address: address,
            totalAmount: sum,
            chains: [
                { chainId: baseSepolia.id.toString(), chainAmount: Number(baseBalance) },
                { chainId: polygonAmoy.id.toString(), chainAmount: Number(polygonBalance) },
                { chainId: optimismSepolia.id.toString(), chainAmount: Number(optimismBalance) },
            ]
        });

    }, [baseLoading, polygonLoading, optimismLoading]);

    return {
        baseBalance,
        polygonBalance,
        optimismBalance,
        total,
    };
}