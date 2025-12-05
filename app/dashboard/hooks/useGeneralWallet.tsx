"use client";

import React, { ReactNode, createContext, useContext, useState } from "react";
import { useEmbedded } from "@/app/dashboard/hooks/embebed";
import {toast} from "react-toastify";

interface XOContractsContextType {
    connect: () => Promise<void>;
    address: string | null;
}

const XOContractsContext = createContext<XOContractsContextType | null>(null);

export const XOContractsProvider = ({ children }: { children: ReactNode }) => {
    const [address, setAddress] = useState<string | null>(null);
    const { isEmbedded } = useEmbedded();

    const chainId = "0x89";
    const rpcUrl = "https://polygon-rpc.com";

    const connect = async () => {
        try {
            toast.info("Comenzando");
            let provider: any;

            // ⬇️ IMPORTS QUE ROMPEN SSR → SE MUEVEN AQUÍ
            const { XOConnectProvider } = await import("xo-connect");
            const { BrowserProvider } = await import("ethers");

            if (isEmbedded) {
                provider = new XOConnectProvider({
                    rpcs: { [chainId]: rpcUrl },
                    defaultChainId: chainId,
                });

                toast.success("es embs");

                await provider.request({ method: "eth_requestAccounts" });
            }

            toast.success("Xd");

            const ethersProvider = new BrowserProvider(provider);
            const signer = await ethersProvider.getSigner();
            const addr = await signer.getAddress();

            setAddress(addr);
            toast.success(`Todo se nos dio ${addr}`);

        } catch (err) {
            console.log("ERROR CONNECT:", err);
            toast.info(`Error ${err}`);
        }
    };

    return (
        <XOContractsContext.Provider value={{ connect, address }}>
            {children}
        </XOContractsContext.Provider>
    );
};

export const useXOContracts = () => {
    const ctx = useContext(XOContractsContext);
    if (!ctx) throw new Error("useXOContracts must be used within XOContractsProvider");
    return ctx;
};
