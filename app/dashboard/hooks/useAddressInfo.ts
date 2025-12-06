import {Address} from "abitype";
import {
    arbitrum,
    arbitrumSepolia,
    base,
    baseSepolia,
    optimism,
    optimismSepolia, polygon,
    polygonAmoy, unichain,
    unichainSepolia
} from "viem/chains";
import {useGetBalanceFromChain} from "@/app/hook/useGetBalanceFromChain";
import {useEffect, useState} from "react";
import {useBalanceStore} from "@/app/store/useBalanceStore";
import {useWalletsInfoStore} from "@/app/store/useWalletsInfoStore";

export const useAddressInfo = (address: Address) => {
    const { balance: baseBalance, loading: baseLoading } = useGetBalanceFromChain(
        process.env.NEXT_PUBLIC_ENVIROMENT === "development" ? baseSepolia : base,
        address,
        process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
            : "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
    );

    const { balance: arbitrumBalance, loading: arbitrumLoading } = useGetBalanceFromChain(
        process.env.NEXT_PUBLIC_ENVIROMENT === "development" ? arbitrumSepolia : arbitrum,
        address,
        process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"
            : "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
    );

    const { balance: optimismBalance, loading: optimismLoading } = useGetBalanceFromChain(
        process.env.NEXT_PUBLIC_ENVIROMENT === "development" ? optimismSepolia : optimism,
        address,
        process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? "0x5fd84259d66Cd46123540766Be93DFE6D43130D7"
            : "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"
    );

    const { balance: unichainBalance, loading: unichainLoading } = useGetBalanceFromChain(
        process.env.NEXT_PUBLIC_ENVIROMENT === "development" ? unichainSepolia : unichain,
        address,
        process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? "0x31d0220469e10c4E71834a79b1f276d740d3768F"
            : "0x078D782b760474a361dDA0AF3839290b0EF57AD6"
    );

    const { balance: polygonBalance, loading: polygonLoading } = useGetBalanceFromChain(
        process.env.NEXT_PUBLIC_ENVIROMENT === "development" ? polygonAmoy : polygon,
        address,
        process.env.NEXT_PUBLIC_ENVIROMENT === "development"
            ? "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582"
            : "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"
    );




    const [total, setTotal] = useState("0");

    const { increment } = useBalanceStore();
    const { addWalletInfo } = useWalletsInfoStore();

    useEffect(() => {
        // Ejecutar solo cuando TODOS terminaron de cargar
        const allLoaded =
            !baseLoading &&
            !arbitrumLoading &&
            !optimismLoading &&
            !unichainLoading &&
            !polygonLoading ;

        if (!allLoaded) return;

        const sum =
            Number(baseBalance) +
            Number(arbitrumBalance) +
            Number(optimismBalance) +
            Number(unichainBalance) +
            Number(polygonBalance) ;

        setTotal(sum.toString());
        increment(sum);

        addWalletInfo({
            address: address,
            totalAmount: sum,
            chains: [
                {
                    chainId: (process.env.NEXT_PUBLIC_ENVIROMENT === "development" ? baseSepolia : base).id.toString(),
                    chainAmount: Number(baseBalance),
                },
                {
                    chainId: (process.env.NEXT_PUBLIC_ENVIROMENT === "development" ? arbitrumSepolia : arbitrum).id.toString(),
                    chainAmount: Number(arbitrumBalance),
                },
                {
                    chainId: (process.env.NEXT_PUBLIC_ENVIROMENT === "development" ? optimismSepolia : optimism).id.toString(),
                    chainAmount: Number(optimismBalance),
                },
                {
                    chainId: (process.env.NEXT_PUBLIC_ENVIROMENT === "development" ? unichainSepolia : unichain).id.toString(),
                    chainAmount: Number(unichainBalance),
                },
                {
                    chainId: (process.env.NEXT_PUBLIC_ENVIROMENT === "development" ? polygonAmoy : polygon).id.toString(),
                    chainAmount: Number(polygonBalance),
                },
            ],
        });

    }, [baseLoading, arbitrumLoading, optimismLoading, unichainLoading, polygonLoading]);

    return {
        baseBalance,
        arbitrumBalance,
        optimismBalance,
        unichainBalance,
        polygonBalance,
        total,
    };
}