"use client";

import React, { ReactNode, createContext, useContext, useState } from "react";
import { XOConnectProvider } from "xo-connect";
import type { WalletClient } from "viem";
import { useEmbedded } from "@/app/dashboard/hooks/embebed";
import { useDisconnect, useWalletClient } from "wagmi";
import { BrowserProvider, Eip1193Provider } from "ethers";

interface XOContractsContextType {
    connect: () => Promise<void>;
    address: string | null;
}

const XOContractsContext = createContext<XOContractsContextType | null>(null);

function walletClientToEip1193Provider(walletClient: WalletClient): Eip1193Provider {
    return walletClient.transport as Eip1193Provider;
}

export const XOContractsProvider = ({ children }: { children: ReactNode }) => {
    const [address, setAddress] = useState<string | null>(null);

    const { data: walletClient } = useWalletClient();
    const { disconnect: wagmiDisconnect } = useDisconnect();
    const { isEmbedded } = useEmbedded();

    // 🔥 POLYGON MAINNET
    const chainId = "0x89";
    const rpcUrl = "https://polygon-rpc.com";

    const connect = async () => {
        try {
            let provider: any;

            if (isEmbedded) {
                // XO Wallet embebido
                provider = new XOConnectProvider({
                    rpcs: { [chainId]: rpcUrl },
                    defaultChainId: chainId,
                });

                await provider.request({ method: "eth_requestAccounts" });

            } else {
                // Normal (wagmi)
                if (!walletClient) throw new Error("Wallet client not found");
                provider = walletClientToEip1193Provider(walletClient);
            }

            // Ethers
            const ethersProvider = new BrowserProvider(provider);
            const signer = await ethersProvider.getSigner();
            const addr = await signer.getAddress();

            setAddress(addr);

        } catch (err) {
            console.log("ERROR CONNECT:", err);
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
