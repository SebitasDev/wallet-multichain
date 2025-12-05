"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { createWalletClient, custom } from "viem";
import { baseSepolia } from "viem/chains";

interface WalletState {
    address: string | null;
    walletClient: any | null;
    initializeWallet: () => Promise<void>;
}

export const useGeneralWalletStore = create<WalletState>((set) => ({
    address: null,
    walletClient: null,

    initializeWallet: async () => {
        try {
            if (typeof window === "undefined") return;

            // IMPORT dinámico seguro
            const xo = await import("xo-connect");
            const XOConnect = xo.XOConnect;
            const XOConnectProvider = xo.XOConnectProvider;

            // 1. Abrir conexión con XO Wallet
            const session = await XOConnect.connect({
                dappName: "My Dapp",
            });

            if (!session) {
                console.warn("User did not authorize XOConnect");
                return;
            }

            console.log("XOConnect session:", session);

            const chainHex = `0x${baseSepolia.id.toString(16)}`;

            // 2. Crear provider XO
            const provider = new XOConnectProvider({
                defaultChainId: chainHex,
                rpcs: { [chainHex]: "https://sepolia.base.org" },
                wallet: session,            // ⭐ IMPORTANTE ⭐
            });

            // 3. Solicitar cuentas al XO Wallet
            await provider.send("eth_requestAccounts", []);

            // 4. Crear Viem client
            const walletClient = createWalletClient({
                chain: baseSepolia,
                transport: custom(provider),
            });

            const [address] = await walletClient.requestAddresses();

            set({ address, walletClient });
        } catch (err) {
            console.error("Error initializing wallet:", err);
        }
    },
}));

export const useGeneralWallet = () => {
    const initializeWallet = useGeneralWalletStore((s) => s.initializeWallet);
    useEffect(() => {
        initializeWallet();
    }, [initializeWallet]);
};
