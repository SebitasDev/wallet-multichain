"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { ethers } from "ethers";
import { baseSepolia } from "viem/chains";
import {toast} from "react-toastify";

interface WalletState {
    address: string | null;
    signer: ethers.Signer | null;
    provider: ethers.providers.Web3Provider | null;
    initializeWallet: () => Promise<void>;
}

export const useGeneralWalletStore = create<WalletState>((set) => ({
    address: null,
    signer: null,
    provider: null,

    initializeWallet: async () => {
        try {
            if (typeof window === "undefined") return;

            // Import dinámico
            const xo = await import("xo-connect");
            const XOConnect = xo.XOConnect;
            const XOConnectProvider = xo.XOConnectProvider;

            // 1. Conectar a XO Wallet
            const session = await XOConnect.connect({
                dappName: "My Dapp",
            });

            if (!session) {
                console.warn("User rejected XOConnect");
                return;
            }

            console.log("XOConnect session:", session);

            const chainHex = `0x${baseSepolia.id.toString(16)}`;

            // 2. Provider EIP1193 (XO Wallet)
            const xoProvider = new XOConnectProvider({
                defaultChainId: chainHex,
                rpcs: { [chainHex]: "https://sepolia.base.org" },
                wallet: session,
            });

            // 3. Convertir provider XO → Ethers (v5)
            const provider = new ethers.providers.Web3Provider(xoProvider as any);

            // 4. Obtener signer
            const signer = provider.getSigner();
            const address = await signer.getAddress();

            set({ address, signer, provider });
            toast.success(`Se pudo conectar con xo ${address}`);
        } catch (err) {
            console.error("Error initializing wallet:", err);
            toast.success(`Error con xo ${err}`);
        }
    },
}));

export const useGeneralWallet = () => {
    const initializeWallet = useGeneralWalletStore((s) => s.initializeWallet);

    useEffect(() => {
        initializeWallet();
    }, [initializeWallet]);
};
