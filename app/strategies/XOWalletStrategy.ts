import { WalletStrategy, WalletConnectionResult, StrategyId } from "./types";
import { BrowserProvider } from "ethers";

export class XOWalletStrategy implements WalletStrategy {
    id: StrategyId = 'xo';
    label = 'XO Wallet';

    private xoProvider: any = null;
    private xoClient: any = null;

    constructor() { }

    isAvailable(): boolean {
        // Typically XO logic checks if it's running inside an iframe or specificenv
        // For now, we assume it's available if the package is loadable or based on config
        return true;
    }

    async connect(args?: { chains?: Record<string, string>, defaultChainId?: string }): Promise<WalletConnectionResult> {
        // Dynamically import to avoid SSR issues if package is browser-only
        const { XOConnectProvider, XOConnect } = await import("xo-connect");

        // Default config if not provided
        const rpcs = args?.chains || {
            ["0x2105"]: "https://mainnet.base.org",
            ["0x89"]: "https://polygon-rpc.com"
        };
        const defaultChainId = args?.defaultChainId || "0x89";

        const provider = new XOConnectProvider({
            rpcs,
            defaultChainId,
        });

        try {
            await provider.request({ method: "eth_requestAccounts" });
        } catch (e: any) {
            const isNoConnection = e?.message?.includes("No connection") || e === "No connection available";
            if (isNoConnection) {
                console.warn("XO Wallet not found (running standalone?).");
            } else {
                console.error("XO Wallet Connection Error:", e);
            }
            throw new Error("No connection available for XO Wallet: " + (e.message || e));
        }
        this.xoProvider = provider;

        const ethersProvider = new BrowserProvider(provider);
        const signer = await ethersProvider.getSigner();
        const address = await signer.getAddress();
        const network = await ethersProvider.getNetwork();

        // Also fetch the client if needed usually
        this.xoClient = await XOConnect.getClient();

        return {
            address,
            chainId: network.chainId.toString(),
            provider: this.xoProvider,
            signer
        };
    }

    async disconnect(): Promise<void> {
        this.xoProvider = null;
        this.xoClient = null;
    }

    getProvider(): any {
        return this.xoProvider;
    }

    getClient(): any {
        return this.xoClient;
    }
}
