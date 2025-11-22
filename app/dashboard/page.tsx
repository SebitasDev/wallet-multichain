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
import { useModalStore } from "../store/useModalStore";

export default function Dashboard() {
  const { addOpen, receiveOpen, openAdd, closeAdd, openReceive, closeReceive } = useModalStore();
  const [openSendModal, setOpenSendModal] = useState(false);
  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendPassword, setSendPassword] = useState("");
  const [sendChain, setSendChain] = useState("base");
  const [sendLoading, setSendLoading] = useState(false);
  const [routeReady, setRouteReady] = useState(false);
  const [routeSummary, setRouteSummary] = useState<AllocationSummary | null>(null);
  const { wallets } = useWallet();
  const { allocateAcrossNetworks } = useFindBestRoute();
  const walletNamesMap = wallets.reduce<Record<string, string>>((acc, w) => {
    acc[w.address.toLowerCase()] = w.name;
    return acc;
  }, {});
  const heroBg = "var(--gradient-hero)";
  const resetSendFields = () => {
    setFromAddress("");
    setToAddress("");
    setSendAmount("");
    setSendPassword("");
    setSendChain("base");
    setSendLoading(false);
    setRouteReady(false);
    setRouteSummary(null);
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
    allocateAcrossNetworks(Number(sendAmount))
      .then((summary) => {
        setRouteSummary(summary);
        setRouteReady(true);
        toast.info("Ruta encontrada. Ahora puedes enviar.");
      })
      .catch((err) => {
        console.error(err);
        toast.error("No se pudo calcular la ruta");
      })
      .finally(() => setSendLoading(false));
  };

  return (
    <Box
      suppressHydrationWarning
      sx={{ minHeight: "100vh", backgroundColor: "#141516" }}
    >
      <TopBar
        onAdd={() => {
          openAdd();
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
        onReceive={() => openReceive()}
      />

      <Box sx={{ maxWidth: 1200, mx: "auto", px: { xs: 2.5, md: 4 } }}>
        <HeroBanner background={heroBg}/>
      </Box>

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
          suppressHydrationWarning
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
        open={addOpen}
        onClose={() => {
          closeAdd();
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
        routeSummary={routeSummary}
        walletNames={walletNamesMap}
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
      <ReceiveModal
        open={receiveOpen}
        wallets={wallets as any}
        onClose={() => closeReceive()}
      />
      <ToastContainer position="top-right" />
    </Box>
  );
}
