import React, { createContext, useContext, useState, useEffect } from "react";
import { Address } from "viem";

export interface WalletInfo {
  name: string;
  address: Address;
  encryptedSeed: string;
}

interface WalletContextType {
    wallets: WalletInfo[];
    addWallet: (mnemonic: string, password: string, ) => Promise<void>;
}

const WalletManager = createContext<WalletContextType>({
    wallets: [],
    addWallet: async () => {}
});