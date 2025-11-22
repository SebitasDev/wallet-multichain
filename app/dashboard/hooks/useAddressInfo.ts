import {Address} from "abitype";
import {baseSepolia, celoSepolia, optimismSepolia} from "viem/chains";
import {useGetBalanceFromChain} from "@/app/hook/useGetBalanceFromChain";
import {useEffect, useState} from "react";
import {useBalanceStore} from "@/app/dashboard/hooks/useBalanceStore";

export const useAddressInfo = (address: Address) => {
    const { balance: baseBalance, loading: baseLoading } =
        useGetBalanceFromChain(baseSepolia, address, "0x036CbD53842c5426634e7929541eC2318f3dCF7e");

    const { balance: celoBalance, loading: celoLoading } =
        useGetBalanceFromChain(celoSepolia, address, "0x01C5C0122039549AD1493B8220cABEdD739BC44E");

    const { balance: optimismBalance, loading: optimismLoading } =
        useGetBalanceFromChain(optimismSepolia, address, "0x5fd84259d66Cd46123540766Be93DFE6D43130D7");

    const [total, setTotal] = useState("0");

    const { increment } = useBalanceStore();

    useEffect(() => {
        // Esperamos a que los tres hayan cargado
        if (baseLoading || celoLoading || optimismLoading) return;

        // Convertimos a número y sumamos
        const sum =
            Number(baseBalance) +
            Number(celoBalance) +
            Number(optimismBalance);

        setTotal(sum.toString());
        increment(sum);

    }, [baseBalance, celoBalance, optimismBalance, baseLoading, celoLoading, optimismLoading]);

    return {
        baseBalance,
        celoBalance,
        optimismBalance,
        total,
    };
}