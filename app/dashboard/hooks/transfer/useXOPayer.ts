import { createPaymentHeader } from "x402/client";
import { privateKeyToAccount } from "viem/accounts";
import { createWalletClient, custom, publicActions } from "viem";
import { Address } from "abitype";
import { decryptPrivateKey } from "@/app/utils/cripto";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { NETWORKS, AvailableChains } from "../wallet/useXOConnect";
import { miscApi } from "@/app/services/api";

interface UseXOPayerProps {
    isUsingXO: boolean;
    xoProviderRef: any;
    address: string | null;
    password: string;
}

export const useXOPayer = ({ isUsingXO, xoProviderRef, address, password }: UseXOPayerProps) => {
    const mainWallet = useXOWalletStore((s) => s.mainWallet);

    const payX402 = async (
        amount: string,
        recipientAddress: string,
        targetChain: AvailableChains
    ) => {
        try {
            const networkConfig = NETWORKS[targetChain];
            const amountAtomic = (parseFloat(amount) * 1_000_000).toString();

            let paymentHeader: string;

            if (isUsingXO && xoProviderRef.current) {
                const walletClient = createWalletClient({
                    chain: networkConfig.chain,
                    transport: custom(xoProviderRef.current),
                    account: address as `0x${string}`,
                }).extend(publicActions);

                paymentHeader = await createPaymentHeader(walletClient as any, 1, {
                    scheme: "exact",
                    network: networkConfig.network,
                    maxAmountRequired: amountAtomic,
                    resource: "https://facilitator.ultravioletadao.xyz",
                    description: "x402 Payment",
                    mimeType: "application/json",
                    payTo: recipientAddress as `0x${string}`,
                    maxTimeoutSeconds: 300,
                    asset: networkConfig.usdc,
                    extra: {
                        name: networkConfig.usdcName,
                        version: networkConfig.usdcVersion,
                    },
                });
            } else {
                const pk = await decryptPrivateKey(
                    mainWallet.encryptedPrivateKey!,
                    password,
                    mainWallet.salt!,
                    mainWallet.iv!
                );

                const account = privateKeyToAccount(pk as Address);

                paymentHeader = await createPaymentHeader(account, 1, {
                    scheme: "exact",
                    network: networkConfig.network,
                    maxAmountRequired: amountAtomic,
                    resource: "https://facilitator.ultravioletadao.xyz",
                    description: "x402 Payment",
                    mimeType: "application/json",
                    payTo: recipientAddress as `0x${string}`,
                    maxTimeoutSeconds: 300,
                    asset: networkConfig.usdc,
                    extra: {
                        name: networkConfig.usdcName,
                        version: networkConfig.usdcVersion,
                    },
                });
            }

            const result = await miscApi.x402Pay({
                paymentHeader,
                recipientAddress,
                amount: amountAtomic,
                network: networkConfig.network,
            });

            return { success: true, txHash: result.transaction };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    };

    return { payX402 };
};
