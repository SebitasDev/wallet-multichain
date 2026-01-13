import { useCallback } from "react";
import { toast } from "react-toastify";
import { StellarService } from "@1llet.xyz/erc4337-gasless-sdk";
import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { decryptPrivateKey } from "@/app/utils/cripto";
import { getOneClickQuote, submitTxHash } from "@/app/stellar-transfer-core/sdk-service";
import { getStellarUSDCBalance } from "@/app/lib/stellar/getStellarUSDCBalance";
import { ChainKey } from "@/app/types/chain";

export const useStellarLogic = () => {
    const encryptedPrivateKeyStellar = useXOWalletStore(s => s.mainWallet.encryptedPrivateKeyStellar);
    const addressStellar = useXOWalletStore(s => s.mainWallet.addressStellar);
    const salt = useXOWalletStore(s => s.mainWallet.salt);
    const iv = useXOWalletStore(s => s.mainWallet.iv);
    const currentPassword = useWalletPasswordStore((s) => s.currentPassword);

    const getStellarKeys = useCallback(async () => {
        if (!encryptedPrivateKeyStellar || !currentPassword || !salt || !iv) {
            throw new Error("Wallet locked. Please unlock to use Stellar.");
        }
        if (!addressStellar) {
            throw new Error("Stellar wallet not initialized.");
        }

        const stellarSecret = await decryptPrivateKey(encryptedPrivateKeyStellar, currentPassword, salt, iv);
        return { publicKey: addressStellar, secret: stellarSecret };
    }, [encryptedPrivateKeyStellar, currentPassword, salt, iv, addressStellar]);

    const executeStellarTransfer = useCallback(async (
        data: {
            destChain: ChainKey;
            recipient: string;
            amount: string;
            sourceToken: string;
            destToken: string;
        },
        senderAddr: string
    ) => {
        // 1. Get Keys
        const { secret } = await getStellarKeys();

        // 2. Get Quote & Deposit Address
        toast.info("Getting One-Click Quote...");
        const { depositAddress, quote } = await getOneClickQuote({
            amount: data.amount,
            sourceChain: "Stellar",
            destinationChain: data.destChain,
            sourceToken: data.sourceToken,
            destinationToken: data.destToken,
            userSenderAddress: senderAddr,
            recipientStellar: data.recipient
        });

        if (!depositAddress) throw new Error("Failed to get deposit address from bridge");

        // @ts-ignore - Memo check
        const memo = quote.quote?.memo;
        if (!memo) throw new Error("Bridge required a memo but none was returned.");

        // 3. Sign & Send
        toast.info("Signing Stellar Transaction...");
        const stellarService = new StellarService();
        const xdr = await stellarService.buildTransferXdr(
            secret,
            depositAddress,
            data.amount,
            data.sourceToken,
            memo
        );

        const result = await stellarService.submitXdr(xdr);
        const txHash = result.hash;

        // 4. Submit Hash
        toast.info("Submitting Transaction Hash...");
        await submitTxHash(txHash, depositAddress);

        return txHash;
    }, [getStellarKeys]);

    const fetchStellarBalance = useCallback(async (address: string) => {
        if (!address || !address.startsWith("G")) return 0;
        try {
            return await getStellarUSDCBalance(address) || 0;
        } catch (e) {
            console.error("Stellar balance fetch error", e);
            return 0;
        }
    }, []);

    return {
        getStellarKeys,
        executeStellarTransfer,
        fetchStellarBalance,
        addressStellar
    };
};
