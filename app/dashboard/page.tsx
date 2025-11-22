"use client";

import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import { AddressCard } from "./components/AddressCard";
import { TopBar } from "./components/TopBar";
import { HeroBanner } from "./components/HeroBanner";
import { AddSecretModal } from "./components/AddSecretModal";
import { SendMoneyModal } from "./components/SendMoneyModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useWallet } from "../hook/useWallet";

export default function Dashboard() {
  const [heroBg, setHeroBg] = useState(
    "linear-gradient(110deg, #1f3fb8 0%, #0086b7 50%, #1aa167 100%)",
  );
  const [openModal, setOpenModal] = useState(false);
  const [walletName, setWalletName] = useState("");
  const [addressValue, setAddressValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [openSendModal, setOpenSendModal] = useState(false);
  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendPassword, setSendPassword] = useState("");
  const [sendChain, setSendChain] = useState("base");
  const [sendLoading, setSendLoading] = useState(false);
  const [routeReady, setRouteReady] = useState(false);
  const { addWallet, wallets } = useWallet();
  const resetModalFields = () => {
    setWalletName("");
    setAddressValue("");
    setPasswordValue("");
  };
  const resetSendFields = () => {
    setFromAddress("");
    setToAddress("");
    setSendAmount("");
    setSendPassword("");
    setSendChain("base");
    setSendLoading(false);
    setRouteReady(false);
  };

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

  const handleSend = () => {
    if (routeReady) {
      toast.success("Transferencia iniciada (demo)");
      setOpenSendModal(false);
      resetSendFields();
      return;
    }

    if (!fromAddress || !toAddress.trim() || !sendAmount.trim() || !sendPassword.trim()) {
      toast.error("Completa todos los campos para enviar");
      return;
    }

    setSendLoading(true);
    setTimeout(() => {
      setSendLoading(false);
      setRouteReady(true);
      toast.info("Ruta encontrada. Ahora puedes enviar.");
    }, 5000);
  };

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f6fb" }}>
      <TopBar
        onAdd={() => {
          resetModalFields();
          setOpenModal(true);
        }}
        onSend={() => {
          resetSendFields();
          setFromAddress(wallets[0]?.address ?? "");
          if (!wallets[0]) {
            toast.error("Primero agrega una wallet de origen.");
            return;
          }
          setOpenSendModal(true);
        }}
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
        open={openSendModal}
        fromAddress={fromAddress}
        toAddress={toAddress}
        amount={sendAmount}
        password={sendPassword}
        chain={sendChain}
        loading={sendLoading}
        routeReady={routeReady}
        recipient={toAddress}
        netAmount={(parseFloat(sendAmount || "0") * 0.99).toFixed(2)}
        onToChange={setToAddress}
        onAmountChange={setSendAmount}
        onPasswordChange={setSendPassword}
        onChainChange={setSendChain}
        onClose={() => {
          setOpenSendModal(false);
          resetSendFields();
        }}
        onSend={handleSend}
      />
      <ToastContainer position="top-right" />
    </Box>
  );
}
