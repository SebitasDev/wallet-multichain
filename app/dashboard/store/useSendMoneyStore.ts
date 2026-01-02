// store/useSendModal.ts
import { create } from 'zustand';

interface SendModalState {
    isOpen: boolean;
    initialChain?: string;
    initialToken?: string;
    setSendModal: (v: boolean, initialChain?: string, initialToken?: string) => void;
}

export const useSendMoneyStore = create<SendModalState>((set) => ({
    isOpen: false,
    initialChain: undefined,
    initialToken: undefined,
    setSendModal: (v, initialChain, initialToken) => set({
        isOpen: v,
        initialChain: v ? initialChain : undefined, // Clear on close
        initialToken: v ? initialToken : undefined
    })
}));
