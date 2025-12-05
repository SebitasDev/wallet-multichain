"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { ethers } from "ethers";
import { toast } from "react-toastify";

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
            toast.info("Iniciando conexión con XO Wallet...");

            if (typeof window === "undefined") return;

            const { XOConnectProvider } = await import("xo-connect");

            // ⚠️ XO OBLIGA a pasar rpcs
            // Base Sepolia → chainId: 0x14a34 (84532)
            const chainHex = "0x14a34";

            const xoProvider = new XOConnectProvider({
                defaultChainId: chainHex,
                rpcs: {
                    [chainHex]: "https://sepolia.base.org", // ⭐ RPC válido
                },
            });

            const provider = new ethers.providers.Web3Provider(xoProvider, "any");

            await provider.send("eth_requestAccounts", []);

            const signer = provider.getSigner();
            const address = await signer.getAddress();

            console.log("XO Wallet connected:", address);

            set({ address, signer, provider });

            toast.success(`Conectado con XO Wallet: ${address}`);
        } catch (err) {
            console.error("Error initializing wallet:", err);
            toast.error(`Error conectando XO: ${String(err)}`);
        }
    },
}));

export const useGeneralWallet = () => {
    const initializeWallet = useGeneralWalletStore((s) => s.initializeWallet);

    useEffect(() => {
        initializeWallet();
    }, [initializeWallet]);
};
