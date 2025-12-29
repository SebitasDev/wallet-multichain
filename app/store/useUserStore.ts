import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
    name: string;
    email: string;
    showBalance: boolean;
    setName: (name: string) => void;
    setEmail: (email: string) => void;
    setShowBalance: (showBalance: boolean) => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            name: "Tobias",
            email: "tinsaurralde17@gmail.com",
            showBalance: true,
            setName: (name) => set({ name }),
            setEmail: (email) => set({ email }),
            setShowBalance: (showBalance) => set({ showBalance }),
        }),
        {
            name: 'user-storage',
        }
    )
);
