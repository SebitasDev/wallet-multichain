import { validateMnemonic, mnemonicToSeedSync } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { HDKey } from "ethereum-cryptography/hdkey";
import { privateKeyToAccount } from "viem/accounts";
import { Buffer } from "buffer";
import { useEffect, useState } from "react";
import { encryptSeed } from "../utils/cripto";
import {WalletInfo} from "@/app/store/useWalletManager";
import {useBalanceStore} from "@/app/store/useBalanceStore";

export const useWallet = ()=> {

  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const { setTotalChains } = useBalanceStore();

  useEffect(() => {
        const stored = localStorage.getItem("wallets");
        if (stored){
            setWallets(JSON.parse(stored));
            setTotalChains(JSON.parse(stored).length);
        }
    }, []);

    const saveWallets = (updated: WalletInfo[]) => {
        setWallets(updated);
        localStorage.setItem("wallets", JSON.stringify(updated))
        setTotalChains(updated.length);
    };

  const addWallet = async (
  mnemonic: string,
  password: string,
  walletName: string,
  ): Promise<WalletInfo[]> => {
    const trimmed = mnemonic.trim();

    if (!validateMnemonic(trimmed, wordlist)) {
      throw new Error(
        "Frase semilla inválida. Asegúrate de escribir las 12/24 palabras correctamente.",
      );
    }

    const encryptedSeed = encryptSeed(trimmed, password);

    const seed = mnemonicToSeedSync(trimmed);
    const root = HDKey.fromMasterSeed(seed);
    const child = root.derive("m/44'/60'/0'/0/0");
    if (!child.privateKey) {
      throw new Error("No se pudo derivar la llave privada.");
    }
    const privateKey = `0x${Buffer.from(child.privateKey).toString("hex")}` as `0x${string}`;
    const account = privateKeyToAccount(privateKey);

    const alreadyExists = wallets.some(
      (w) => w.address.toLowerCase() === account.address.toLowerCase(),
    );
    if (alreadyExists) {
      throw new Error("Esta wallet ya está agregada.");
    }

    const newWallet: WalletInfo = {
      name: walletName,
      address: account.address,
      encryptedSeed,
    };

    const updated = [...wallets, newWallet];

    saveWallets(updated);

    return [newWallet];
  };

  return {
    addWallet,
    wallets
  }
}
