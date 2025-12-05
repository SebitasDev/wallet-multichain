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
            toast.success(`inicio de conexion`);
            if (typeof window === "undefined") return;

            const xo = await import("xo-connect");
            const XOConnect = xo.XOConnect;
            const XOConnectProvider = xo.XOConnectProvider;

            const session = await XOConnect.connect({
                dappName: "My Dapp",
            });

            if (!session) {
                console.warn("User rejected XOConnect");
                return;
            }

            console.log("XOConnect session:", session);

            const chainHex = `0x${baseSepolia.id.toString(16)}`;

            const xoProvider = new XOConnectProvider({
                defaultChainId: chainHex,
                rpcs: { [chainHex]: "https://sepolia.base.org" },
                wallet: session,
            });

            // 🔥 NECESARIO PARA QUE EXISTA UNA CUENTA
            const accounts = await xoProvider.request({
                method: "eth_requestAccounts",
                params: [],
            });

            if (!accounts || accounts.length === 0) {
                console.error("XO Wallet did not provide accounts");
                return;
            }

            const provider = new ethers.providers.Web3Provider(xoProvider as any);

            // 🔥 IMPORTANTE: pasar el address explícito
            const signer = provider.getSigner(accounts[0]);

            set({ address: accounts[0], signer, provider });

            toast.success(`Se pudo conectar con xo ${accounts[0]}`);
            console.error(`Se pudo conectar con xo ${accounts[0]}`)
        } catch (err) {
            console.error("Error initializing wallet:", err);
            toast.error(`Error con xo ${err}`);
            console.error(`Error con xo ${err}`)
        }
    },
}));

export const useGeneralWallet = () => {
    const initializeWallet = useGeneralWalletStore((s) => s.initializeWallet);

    useEffect(() => {
        initializeWallet();
    }, [initializeWallet]);
};
