import { WalletInfo } from "../hook/wallet";

const KEY = "wallets";

export const loadWallets = (): WalletInfo[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as WalletInfo[]) : [];
  } catch {
    return [];
  }
};

export const saveWallets = (wallets: WalletInfo[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(wallets));
};
