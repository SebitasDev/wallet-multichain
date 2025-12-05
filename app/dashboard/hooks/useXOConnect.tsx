"use client";

import React, { ReactNode, createContext, useContext, useState, useEffect } from "react";
import { useEmbedded } from "@/app/dashboard/hooks/embebed";
import { toast } from "react-toastify";

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
            toast.info("Conectando con Beexo");

            const { XOConnectProvider } = await import("xo-connect");
            const { BrowserProvider } = await import("ethers");
            const { XOConnect } = await import("xo-connect");

            let provider: any;

            if (isEmbedded) {
                provider = new XOConnectProvider({
                    rpcs: { [chainId]: rpcUrl },
                    defaultChainId: chainId,
                });

                await provider.request({ method: "eth_requestAccounts" });
            }

            const ethersProvider = new BrowserProvider(provider);
            const signer = await ethersProvider.getSigner();
            const addr = await signer.getAddress();

            setAddress(addr);
            toast.success(`Wallet de Beexo Conectada: ${addr}`);
            const client = await XOConnect.getClient();
            toast.success(`User alias: ${client?.alias}`);
            toast.success(`Wallet de Beexo Conectada: ${client?.currencies}`);

        } catch (err) {
            console.log("ERROR CONNECT:", err);
            toast.error(`Error: ${err}`);
        }
    };

    // ⭐ AUTOMÁTICO: se ejecuta apenas exista isEmbedded
    useEffect(() => {
        if (isEmbedded) {
            connect();
        }
    }, [isEmbedded]);

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
