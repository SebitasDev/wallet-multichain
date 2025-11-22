"use client";

import { Box } from "@mui/material";
import { useState } from "react";
import { AddressCard } from "./components/AddressCard";
import { TopBar } from "./components/TopBar";
import { HeroBanner } from "./components/HeroBanner";
import { AddSecretModal } from "./components/AddSecretModal";
import { SendMoneyModal } from "./components/SendMoneyModal";
import { ReceiveModal } from "./components/ReceiveModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useWallet } from "../hook/useWallet";
import { useFindBestRoute } from "./hooks/useFindBestRoute";
import { AllocationSummary } from "./types";
import {useSendModalState} from "@/app/dashboard/store/useSendModalState";

export default function Dashboard() {
  const [openModal, setOpenModal] = useState(false);
  const [walletName, setWalletName] = useState("");
  const [addressValue, setAddressValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const { setSendModal } = useSendModalState();
  const [openReceiveModal, setOpenReceiveModal] = useState(false);
  const [receiveWallet, setReceiveWallet] = useState("");
  const [receiveChain, setReceiveChain] = useState("base");
  const { addWallet, wallets, unlockWallet } = useWallet();
  const walletNamesMap = wallets.reduce<Record<string, string>>((acc, w) => {
    acc[w.address.toLowerCase()] = w.name;
    return acc;
  }, {});
  const heroBg = "var(--gradient-hero)";
  const resetModalFields = () => {
    setWalletName("");
    setAddressValue("");
    setPasswordValue("");
  };

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

  const openReceive = () => {
    if (!wallets.length) {
      toast.error("Primero agrega una wallet.");
      return;
    }
    setReceiveWallet(wallets[0]?.address || "");
    setReceiveChain("base");
    setOpenReceiveModal(true);
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#141516ff" }}>
      <TopBar
        onAdd={() => {
          resetModalFields();
          setOpenModal(true);
        }}
        onSend={() => {
          //resetSendFields();
          //setFromAddress(wallets[0]?.address ?? "");
          if (!wallets[0]) {
            toast.error("Primero agrega una wallet de origen.");
            return;
          }
          setSendModal(true);
        }}
        onReceive={openReceive}
      />

      <HeroBanner background={heroBg}/>

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
      <SendMoneyModal
        walletNames={walletNamesMap}
      />
      <ReceiveModal
        open={openReceiveModal}
        wallets={wallets as any}
        selectedWallet={receiveWallet}
        selectedChain={receiveChain}
        onWalletChange={setReceiveWallet}
        onChainChange={setReceiveChain}
        onClose={() => setOpenReceiveModal(false)}
      />
      <ToastContainer position="top-right" />
    </Box>
  );
}
