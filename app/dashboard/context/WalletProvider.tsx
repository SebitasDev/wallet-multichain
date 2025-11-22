"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { mnemonicToSeedSync, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { HDKey } from "ethereum-cryptography/hdkey";
import { privateKeyToAccount } from "viem/accounts";
import { Buffer } from "buffer";
import { decryptSeed } from "../utils/cripto";
import { addWallet as addWalletUtil, WalletInfo } from "../utils/wallet";
import { loadWallets, saveWallets } from "../utils/storage";

type WalletContextType = {
  wallets: WalletInfo[];
  addWallet: (mnemonic: string, password: string, name: string) => Promise<void>;
  unlockWallet: (address: string, password: string) => Promise<ReturnType<typeof privateKeyToAccount>>;
};

const WalletManager = createContext<WalletContextType>({
  wallets: [],
  addWallet: async () => {},
  unlockWallet: async () => {
    throw new Error("Wallet no encontrada");
  },
});

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);

  useEffect(() => {
    setWallets(loadWallets());
  }, []);

  useEffect(() => {
    saveWallets(wallets);
  }, [wallets]);

  const addWallet = async (mnemonic: string, password: string, name: string) => {
    const updated = await addWalletUtil(mnemonic, password, wallets, name);
    setWallets(updated);
  };

  const unlockWallet = async (address: string, password: string) => {
    const wallet = wallets.find((w) => w.address === address);
    if (!wallet) throw new Error("Wallet no encontrada");

    const mnemonic = decryptSeed(wallet.encryptedSeed, password);
    if (!mnemonic) throw new Error("Contrasena incorrecta");

    if (!validateMnemonic(mnemonic.trim(), wordlist)) {
      throw new Error("Frase semilla invalida. Asegurate de escribir las 12/24 palabras correctamente.");
    }

    const seed = mnemonicToSeedSync(mnemonic);
    const root = HDKey.fromMasterSeed(seed);
    const child = root.derive("m/44'/60'/0'/0/0");
    if (!child.privateKey) throw new Error("No se pudo derivar la llave privada.");
    const privateKey = `0x${Buffer.from(child.privateKey).toString("hex")}` as `0x${string}`;
    return privateKeyToAccount(privateKey);
  };

  return (
    <WalletManager.Provider value={{ wallets, addWallet, unlockWallet }}>
      {children}
    </WalletManager.Provider>
  );
};

export const useWallets = () => useContext(WalletManager);
