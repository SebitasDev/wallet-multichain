"use client";

import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import { AddressCard } from "./components/AddressCard";
import { WalletCard } from "./components/WalletCard";
import { TopBar } from "./components/TopBar";
import { HeroBanner } from "./components/HeroBanner";
import { AddSecretModal } from "./components/AddSecretModal";
import { Wallet } from "./types";
import { addWallet, WalletInfo } from "./utils/wallet";
import { loadWallets, saveWallets } from "./utils/storage";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const wallets: Wallet[] = [];

export default function Dashboard() {
  const [heroBg, setHeroBg] = useState(
    "linear-gradient(110deg, #1f3fb8 0%, #0086b7 50%, #1aa167 100%)",
  );
  const [heroTotal, setHeroTotal] = useState<number | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [walletName, setWalletName] = useState("");
  const [addressValue, setAddressValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [savedWallets, setSavedWallets] = useState<WalletInfo[]>([]);

  useEffect(() => {
    const pastelOscuro = () =>
      `hsl(${Math.floor(Math.random() * 360)}, 80%, 65%)`;
    const c1 = pastelOscuro();
    const c2 = pastelOscuro();
    setHeroBg(`linear-gradient(135deg, ${c1}, ${c2})`);

    const randomTotal = Math.random() * 15000 + 12000;
    setHeroTotal(Number(randomTotal.toFixed(2)));
  }, []);

  useEffect(() => {
    setSavedWallets(loadWallets());
  }, []);

  useEffect(() => {
    saveWallets(savedWallets);
  }, [savedWallets]);

  const words = addressValue.trim() ? addressValue.trim().split(/\s+/).filter(Boolean) : [];

  const handleAddWallet = async () => {
    if (!walletName.trim() || !passwordValue.trim() || words.length !== 12) return;
    try {
      const updated = await addWallet(addressValue, passwordValue, savedWallets, walletName);
      setSavedWallets(updated);
      setOpenModal(false);
      setWalletName("");
      setAddressValue("");
      setPasswordValue("");
      toast.success(`Wallet "${walletName}" agregada y cifrada correctamente`);
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || "No se pudo agregar la wallet");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f6fb" }}>
      <TopBar onAdd={() => setOpenModal(true)} />

      <HeroBanner background={heroBg} total={heroTotal} />

      <Box
        sx={{
          maxWidth: 1200,
          mx: "auto",
          px: { xs: 2.5, md: 4 },
          pb: 6,
          mt: 4,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(auto-fit, minmax(340px, 1fr))",
            },
            gap: { xs: 2.5, md: 3 },
            alignItems: "start",
          }}
        >
          {wallets.map((wallet) => (
            <Box key={wallet.name} sx={{ minWidth: 0 }}>
              <WalletCard wallet={wallet} />
            </Box>
          ))}
          <Box sx={{ minWidth: 0 }}>
            <AddressCard />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <AddressCard />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <AddressCard />
          </Box>
        </Box>
      </Box>

      <AddSecretModal
        open={openModal}
        walletName={walletName}
        phrase={addressValue}
        wordsCount={words.length}
        password={passwordValue}
        onWalletNameChange={setWalletName}
        onPhraseChange={setAddressValue}
        onPasswordChange={setPasswordValue}
        onConfirm={handleAddWallet}
        onClose={() => setOpenModal(false)}
      />
      <ToastContainer position="top-right" />
    </Box>
  );
}
