export interface WalletConnectionResult {
    address: string;
    chainId: string;
    provider?: any; // EIP-1193 Provider or WalletClient
    signer?: any;   // Ethers Signer or similar
}

export type StrategyId = 'local' | 'metamask' | 'xo' | 'embedded' | 'walletconnect' | 'coinbase';

export interface WalletStrategy {
    id: StrategyId;
    label: string;
    icon?: React.ReactNode;
    
    /**
     * Checks if the strategy can be used in the current environment
     * (e.g. is MetaMask extension installed?)
     */
    isAvailable(): boolean;

    /**
     * Connects to the wallet.
     * @param args Optional arguments (e.g. password for local wallet, chainId for others)
     */
    connect(args?: any): Promise<WalletConnectionResult>;

    /**
     * Disconnects the wallet.
     */
    disconnect(): Promise<void>;

    /**
     * Returns the underlying provider if available.
     */
    getProvider(): any;
}
