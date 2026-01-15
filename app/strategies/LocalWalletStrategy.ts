import { WalletStrategy, WalletConnectionResult, StrategyId } from "./types";
import { Wallet } from "ethers";
import { decryptPrivateKey } from "@/app/utils/cripto";

export class LocalWalletStrategy implements WalletStrategy {
    id: StrategyId = 'local';
    label = 'Local Wallet';

    private wallet: Wallet | null = null;

    isAvailable(): boolean {
        return true; // Always available if the user has a stored encrypted key
    }

    /**
     * Connects using the encrypted private key and a password.
     * Args must contain: { encryptedPrivateKey, password, salt, iv }
     */
    async connect(args: {
        encryptedPrivateKey: string;
        password: string;
        salt: string;
        iv: string;
        provider?: any
    }): Promise<WalletConnectionResult> {
        if (!args.encryptedPrivateKey || !args.password || !args.salt || !args.iv) {
            throw new Error("Missing credentials for local wallet");
        }

        try {
            const privateKey = await decryptPrivateKey(
                args.encryptedPrivateKey,
                args.password,
                args.salt,
                args.iv
            );

            // Create ethers wallet
            // We can attach a provider if passed, or leave it cleaner
            this.wallet = new Wallet(privateKey, args.provider);

            return {
                address: this.wallet.address,
                chainId: "0", // Local wallet technically works on any chain, we don't strictly bind it here unless we attach a provider
                signer: this.wallet,
                provider: null // Local wallet is a signer, not a provider itself usually
            };
        } catch (error) {
            console.error("Failed to decrypt local wallet", error);
            throw new Error("Incorrect password or corrupted wallet data");
        }
    }

    async disconnect(): Promise<void> {
        this.wallet = null;
    }

    getProvider(): any {
        return null;
    }

    getSigner(): any {
        return this.wallet;
    }
}
