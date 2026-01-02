// store/useSendModal.ts
import { create } from 'zustand';

interface SendModalState {
    isOpen: boolean;
    initialChain?: string;
    initialToken?: string;
    lockChain?: boolean; // [NEW] - If true, prevents changing source/dest chain
    setSendModal: (v: boolean, initialChain?: string, initialToken?: string, lockChain?: boolean) => void;
}

export const useSendMoneyStore = create<SendModalState>((set) => ({
    isOpen: false,
    initialChain: undefined,
    initialToken: undefined,
    lockChain: false,
    setSendModal: (v, initialChain, initialToken, lockChain) => set({
        isOpen: v,
        initialChain: v ? initialChain : undefined, // Clear on close
        initialToken: v ? initialToken : undefined,
        lockChain: v ? !!lockChain : false // Clear on close
    })
}));
