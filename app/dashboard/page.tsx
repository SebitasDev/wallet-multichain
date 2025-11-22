"use client";

import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import { AddressCard } from "./components/AddressCard";
import { TopBar } from "./components/TopBar";
import { HeroBanner } from "./components/HeroBanner";
import { AddSecretModal } from "./components/AddSecretModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useWallet } from "../hook/useWallet";
import {useBalanceStore} from "@/app/dashboard/hooks/useBalanceStore";

export default function Dashboard() {
  const [heroBg, setHeroBg] = useState(
    "linear-gradient(110deg, #1f3fb8 0%, #0086b7 50%, #1aa167 100%)",
  );
  const [openModal, setOpenModal] = useState(false);
  const [walletName, setWalletName] = useState("");
  const [addressValue, setAddressValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const { addWallet, wallets } = useWallet();
  const resetModalFields = () => {
    setWalletName("");
    setAddressValue("");
    setPasswordValue("");
  };
  const { value } = useBalanceStore();

  useEffect(() => {
    const pastelOscuro = () =>
      `hsl(${Math.floor(Math.random() * 360)}, 80%, 65%)`;
    const c1 = pastelOscuro();
    const c2 = pastelOscuro();
    setHeroBg(`linear-gradient(135deg, ${c1}, ${c2})`);
  }, []);
  const words = addressValue.trim() ? addressValue.trim().split(/\s+/).filter(Boolean) : [];

  const handleAddWallet = async () => {
    if (!walletName.trim() || !passwordValue.trim() || words.length !== 12) return;
    try {
      const updated = await addWallet(addressValue, passwordValue, walletName);
      setOpenModal(false);
      resetModalFields();
      toast.success(`Wallet "${walletName}" agregada y cifrada correctamente`);
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || "No se pudo agregar la wallet");
      resetModalFields();
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f6fb" }}>
      <TopBar
        onAdd={() => {
          resetModalFields();
          setOpenModal(true);
        }}
      />

      <HeroBanner background={heroBg} total={value} />

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
            <Box key={wallet.address} sx={{ minWidth: 0 }}>
              <AddressCard address={wallet.address} walletName={wallet.name}/>
            </Box>
          ))}
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
        onClose={() => {
          setOpenModal(false);
          resetModalFields();
        }}
      />
      <ToastContainer position="top-right" />
    </Box>
  );
}
