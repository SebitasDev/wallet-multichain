export type TransactionStatus = 'SUCCESS' | 'PENDING' | 'FAILED';

export interface TransactionRoute {
    chainName: string;
    amount: number;
    status: TransactionStatus;
    txHash?: string;
}

export interface Transaction {
    id: string;
    status: TransactionStatus;
    fromAddress: string;
    totalAmount: number;
    createdAt: number;
    route: TransactionRoute[];
    tokenSymbol?: string;
    decimals?: number;
}
