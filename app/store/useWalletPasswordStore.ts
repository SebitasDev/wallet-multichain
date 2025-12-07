import {create} from "zustand";
import {persist} from "zustand/middleware";
import {decryptPrivateKey, encryptPrivateKey, generateSalt} from "@/app/utils/cripto";

interface EncryptedPassword {
    encrypted: string;
    iv: string;
    salt: string;
}

interface WalletState {
    encryptedPassword: EncryptedPassword | null;
    currentPassword: string | null;
    setPassword: (password: string) => Promise<void>;
    getPassword: (password: string)  => Promise<string | null>;
    verifyPassword: (password: string) => Promise<boolean>;
    setCurrentPassword: (password: string) => void;
}

export const useWalletPasswordStore = create<WalletState>()(
    persist(
        (set, get) => ({
            encryptedPassword: null,

            currentPassword: null,

            setCurrentPassword: (password) => set({ currentPassword: password }),

            setPassword: async (password: string) => {
                const salt = generateSalt();

                const result = await encryptPrivateKey(password, password, salt);

                set({
                    encryptedPassword: {
                        encrypted: result.encrypted,
                        iv: result.iv,
                        salt,
                    },
                });
            },

            getPassword: async (password: string) => {
                const state = get();

                if (!state.encryptedPassword) return null;

                const { encrypted, iv, salt } = state.encryptedPassword;

                try {
                    return await decryptPrivateKey(
                        encrypted,
                        password,
                        salt,
                        iv
                    );
                } catch {
                    return null;
                }
            },

            verifyPassword: async (password: string) => {
                const data = get().encryptedPassword;
                if (!data) return false;

                try {
                    const decrypted = await decryptPrivateKey(
                        data.encrypted,
                        password,
                        data.salt,
                        data.iv
                    );

                    return decrypted === password;
                } catch {
                    return false;
                }
            },
        }),
        {
            name: "wallet_password",
            partialize: (state) => ({
                encryptedPassword: state.encryptedPassword,
            }),
        }
    )
);
