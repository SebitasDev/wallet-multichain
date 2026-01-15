import { WalletStrategy, WalletConnectionResult, StrategyId } from "./types";
import { BrowserProvider } from "ethers";

export class MetaMaskStrategy implements WalletStrategy {
    id: StrategyId = 'metamask';
    label = 'MetaMask';

    // We can add an icon here later if needed, or handle it in the UI layer

    isAvailable(): boolean {
        return typeof window !== 'undefined' && !!window.ethereum;
    }

    async connect(args?: { chainId?: string }): Promise<WalletConnectionResult> {
        if (!this.isAvailable()) {
            throw new Error("MetaMask is not installed");
        }

        const provider = new BrowserProvider(window.ethereum as any);

        // Request accounts
        const accounts = await provider.send("eth_requestAccounts", []);
        if (!accounts || accounts.length === 0) {
            throw new Error("No accounts found");
        }

        const address = accounts[0];

        // Switch chain if requested
        if (args?.chainId) {
            try {
                // Ensure hex format
                const chainIdHex = args.chainId.startsWith('0x')
                    ? args.chainId
                    : `0x${parseInt(args.chainId).toString(16)}`;

                try {
                    await (window.ethereum as any).request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: chainIdHex }],
                    });
                } catch (err: any) {
                    // Ignore pending request error
                    if (err.code === -32002) {
                        console.warn("MetaMask request already pending. Please check your extension.");
                        // We can return existing connection or throw a user-friendly error
                        throw new Error("Please check your MetaMask extension. A request is already pending.");
                    }
                    // Error 4902: Chain not added
                    if (err.code === 4902) {
                        throw new Error("Network not available in MetaMask. Please add it manually.");
                    }
                    throw err;
                }
            } catch (switchError: any) {
                // Error 4902: Chain not added
                if (switchError.code === 4902) {
                    throw new Error("Network not available in MetaMask. Please add it manually.");
                }
                console.warn("Failed to switch chain:", switchError);
            }
        }

        const network = await provider.getNetwork();
        const signer = await provider.getSigner();

        return {
            address,
            chainId: network.chainId.toString(),
            provider: typeof window !== 'undefined' ? window.ethereum : null,
            signer
        };
    }

    async disconnect(): Promise<void> {
        // MetaMask doesn't strictly support disconnect via API, 
        // usually handled by clearing local state
    }

    getProvider(): any {
        return typeof window !== 'undefined' ? window.ethereum : null;
    }
}
