import { Transaction, TransactionRoute, TransactionStatus } from "@/app/types/Transaction";

export const createTransaction = (
    fromAddress: string,
    totalAmount: number,
    routes: TransactionRoute[],
    status: TransactionStatus = 'PENDING'
): Transaction => {
    return {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        fromAddress,
        totalAmount,
        route: routes,
        status,
    };
};

export const createRoute = (
    chainName: string,
    amount: number,
    status: TransactionStatus = 'PENDING',
    txHash?: string
): TransactionRoute => {
    return {
        chainName,
        amount,
        status,
        txHash
    };
};
