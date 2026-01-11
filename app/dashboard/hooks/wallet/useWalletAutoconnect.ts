import { useEffect, MutableRefObject } from "react";
import { ChainKey } from "@/app/types/chain";
import { ActiveWallet } from "@/app/dashboard/hooks/dashboard/useHeroBanner";
import { AccountAbstraction } from "@1llet.xyz/erc4337-gasless-sdk";

export const useWalletAutoconnect = (
    activeWallet: ActiveWallet,
    smartAccountAddress: string | null,
    isConnecting: boolean,
    hasManuallyDisconnected: MutableRefObject<boolean>,
    connectionType: 'local' | 'metamask' | null,
    currentPassword: string | null,
    selectedChain: ChainKey,
    connect: (chainKey: ChainKey, useMetaMask?: boolean) => Promise<AccountAbstraction | null>
) => {
    useEffect(() => {
        const autoConnect = async () => {
            if (
                activeWallet === "EVM" &&
                !smartAccountAddress &&
                !isConnecting &&
                !hasManuallyDisconnected.current
            ) {
                if (connectionType === 'metamask') {
                    console.log("[AutoConnect] Reconnecting MetaMask...");
                    await connect(selectedChain, true);
                } else if (currentPassword) {
                    console.log("[AutoConnect] Connecting Local Wallet SDK...");
                    await connect(selectedChain, false);
                }
            }
        };
        autoConnect();
    }, [
        activeWallet,
        smartAccountAddress,
        currentPassword,
        isConnecting,
        selectedChain,
        connectionType,
        hasManuallyDisconnected,
        connect
    ]);
};
