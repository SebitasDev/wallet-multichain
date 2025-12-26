import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
    name: string;
    setName: (name: string) => void;
}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            name: "Santiago", // Default hardcoded as per previous visuals, but mutable
            setName: (name) => set({ name }),
        }),
        {
            name: 'user-storage',
        }
    )
);
