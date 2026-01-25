import { useEffect, MutableRefObject } from "react";
import { ChainKey } from "@/app/types/chain";
import { ActiveWallet } from "@/app/dashboard/hooks/dashboard/useHeroBanner";
import { AccountAbstraction } from "@1llet.xyz/erc4337-gasless-sdk";
import { NETWORKS } from "@/app/constants/chainsInformation";

import { useXOWalletStore } from "@/app/store/useXOWalletStore";

export const useWalletAutoconnect = (
    activeWallet: ActiveWallet,
    smartAccountAddress: string | null,
    isConnecting: boolean,
    hasManuallyDisconnected: MutableRefObject<boolean>,
    connectionType: 'local' | 'metamask' | 'embedded' | null,
    currentPassword: string | null,
    selectedChain: ChainKey,
    connect: (chainKey: ChainKey, signerOrProvider: any) => Promise<AccountAbstraction | null>,
    walletContext: any
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
                    try {
                        const config = NETWORKS[selectedChain];
                        const chainIdStr = config?.evm?.chain?.id?.toString();

                        await walletContext.connect('metamask', { chainId: chainIdStr });
                        const signer = walletContext.getSigner();
                        await connect(selectedChain, signer);
                    } catch (e) {
                        console.error("AutoConnect MetaMask failed", e);
                    }
                } else if (currentPassword && connectionType === 'local') {
                    console.log("[AutoConnect] Connecting Local Wallet SDK...");
                    try {
                        const { mainWallet } = useXOWalletStore.getState();
                        const { encryptedPrivateKey, salt, iv } = mainWallet;

                        if (encryptedPrivateKey && salt && iv) {
                            const result = await walletContext.connect('local', {
                                encryptedPrivateKey,
                                password: currentPassword,
                                salt,
                                iv
                            });
                            await connect(selectedChain, result.signer);
                        }
                    } catch (e) {
                        console.error("AutoConnect Local failed", e);
                    }
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
        connect,
        walletContext
    ]);
};
