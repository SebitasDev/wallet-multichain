"use client";

import React, { ReactNode, createContext, useContext, useState } from "react";
import { XOConnectProvider } from "xo-connect";
import type { WalletClient } from "viem";
import { useEmbedded } from "@/app/dashboard/hooks/embebed";
import { useDisconnect, useWalletClient } from "wagmi";
import { BrowserProvider, Eip1193Provider } from "ethers";
import {toast} from "react-toastify";

interface XOContractsContextType {
    connect: () => Promise<void>;
    address: string | null;
}

const XOContractsContext = createContext<XOContractsContextType | null>(null);

function walletClientToEip1193Provider(walletClient: WalletClient): Eip1193Provider {
    return walletClient.transport as Eip1193Provider;
}

export const XOContractsProvider = ({ children }: { children: ReactNode }) => {
    console.log("p")

    const [address, setAddress] = useState<string | null>(null);

    const { isEmbedded } = useEmbedded();

    console.log(isEmbedded)

    // 🔥 POLYGON MAINNET
    const chainId = "0x89";
    const rpcUrl = "https://polygon-rpc.com";

    console.log("ultimo antes conextar")

    const connect = async () => {
        console.log("test connect");
        try {
            toast.info("Comenzando");
            let provider: any;

            if (isEmbedded) {
                // XO Wallet embebido
                provider = new XOConnectProvider({
                    rpcs: { [chainId]: rpcUrl },
                    defaultChainId: chainId,
                });

                toast.success("es embs");

                await provider.request({ method: "eth_requestAccounts" });

            }

            toast.success("Xd");

            // Ethers
            const ethersProvider = new BrowserProvider(provider);
            const signer = await ethersProvider.getSigner();
            const addr = await signer.getAddress();

            setAddress(addr);
            toast.success(`Todo se nos dios ${addr}`);

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
