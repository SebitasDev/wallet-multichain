import { validateMnemonic, mnemonicToSeedSync } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { HDKey } from "ethereum-cryptography/hdkey";
import { privateKeyToAccount } from "viem/accounts";
import { Buffer } from "buffer";
import { encryptSeed } from "./cripto";

export interface WalletInfo {
  name: string;
  address: string;
  encryptedSeed: string;
}

export const addWallet = async (
  mnemonic: string,
  password: string,
  wallets: WalletInfo[],
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

  const newWallet: WalletInfo = {
    name: walletName,
    address: account.address,
    encryptedSeed,
  };

  return [...wallets, newWallet];
};
