import CryptoJS from "crypto-js";

export const encryptSeed = (seed: string, password: string): string => {
  return CryptoJS.AES.encrypt(seed, password).toString();
};

export const decryptSeed = (cipher: string, password: string): string | null => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipher, password);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || null;
  } catch {
    return null;
  }
};
