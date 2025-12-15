// store/useSendModal.ts
import { create } from 'zustand';

interface SendModalState {
    isOpen: boolean;
    setSendModal: (v: boolean) => void;
}

export const useSendMoneyStore = create<SendModalState>((set) => ({
    isOpen: false,
    setSendModal: (v) => set({ isOpen: v })
}));
