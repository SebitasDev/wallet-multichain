"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CircularProgress from "@mui/material/CircularProgress";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { BaseIcon } from "@/app/components/atoms/BaseIcon";
import { OPIcon } from "@/app/components/atoms/OPIcon";
import { formatCurrency } from "@/app/utils/formatCurrency";
import { AllocationSummary } from "../types";
import ArbIcon from "@/app/components/atoms/ArbIcon";
import {arbitrumSepolia, baseSepolia, optimismSepolia} from "viem/chains";
import {useState} from "react";
import {toast} from "react-toastify";
import {useFindBestRoute} from "@/app/dashboard/hooks/useFindBestRoute";
import {useSendModalState} from "@/app/dashboard/store/useSendModalState";
import {Address} from "abitype";
import {useWalletStore} from "@/app/store/useWalletsStore";
import {useGeneralWalletStore} from "@/app/store/useGeneralWalletStore";
import {getPrivateClientByNetworkName} from "@/app/utils/getClientByNetworkName";
import {privateKeyToAccount} from "viem/accounts";
import {createPublicClient, http, parseUnits} from "viem";
import {createAccount} from "@/app/cross-chain-core/clientFactory";
import {createPaymaster} from "@/app/cross-chain-core/paymasterFactory";
import {bundlerClientFactory} from "@/app/cross-chain-core/bundlerClientFactory";
import {usdcAbi} from "@/app/cross-chain-core/usdcAbi";
import {createAuthorization} from "@/app/cross-chain-core/autorizationFactory";
import {toUSDCBigInt} from "@/app/utils/toUSDCBigInt";

type Props = {
    walletNames?: Record<string, string>;
};

export function SendMoneyModal({walletNames}: Props) {

    const [toAddress, setToAddress] = useState("");
    const [sendAmount, setSendAmount] = useState("");
    const [sendPassword, setSendPassword] = useState("");
    const [sendChain, setSendChain] = useState("Base_Sepolia");
    const [sendLoading, setSendLoading] = useState(false);
    const [routeReady, setRouteReady] = useState(false);
    const [routeSummary, setRouteSummary] = useState<AllocationSummary | null>(null);
    const { allocateAcrossNetworks } = useFindBestRoute();
    const { unlockWallet } = useWalletStore();
    const { address, privateKey } = useGeneralWalletStore();
    const { setSendModal, isOpen } = useSendModalState();

    const handleSend = () => {
        if (routeReady) {
            toast.success("Transferencia iniciada (demo)");
            setSendModal(false);
            resetSendFields();
            return;
        }

        if (!toAddress.trim() || !sendAmount.trim() || !sendPassword.trim()) {
            toast.error("Completa todos los campos para enviar");
            return;
        }

        setSendLoading(true);
        allocateAcrossNetworks(Number(sendAmount), toAddress as Address, sendChain)
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

    const handleOnTest = async () => {
        console.log("🔹 Starting handleOnTest");

        const account = privateKeyToAccount(privateKey!);
        console.log("Account:", account.address);

        const CHAIN_MAP: Record<string, string> = {
            Optimism_Sepolia: "Optimism_Sepolia",
            Arbitrum_Sepolia: "Arbitrum_Sepolia",
            Base_Sepolia: "Base_Sepolia",
        };

        const TOKEN_MAP: Record<string, string> = {
            Optimism_Sepolia: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
            Arbitrum_Sepolia: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
            Base_Sepolia: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
        };

        const CHAIN_CONFIG: Record<string, any> = {
            Optimism_Sepolia: optimismSepolia,
            Arbitrum_Sepolia: arbitrumSepolia,
            Base_Sepolia: baseSepolia,
        };

        const toValidChain = CHAIN_MAP[sendChain] ?? "Base_Sepolia";
        console.log("Destination chain:", toValidChain);

        const getWriter = (chainName: string) => {
            console.log("Getting client for chain:", chainName);
            return getPrivateClientByNetworkName(CHAIN_CONFIG[chainName].id.toString(), account);
        };

        const transfer = async (
            chainName: string,
            to: string,
            amount: bigint,
            optionalPrivateKey?: string
        ) => {
            const token = TOKEN_MAP[chainName];

            const client = optionalPrivateKey
                ? getPrivateClientByNetworkName(CHAIN_CONFIG[chainName].id.toString(), privateKeyToAccount(optionalPrivateKey as Address))
                : getWriter(chainName);

            console.log(`➡️ Transferring ${amount} on ${chainName} to ${to} using ${optionalPrivateKey ? "custom key" : "main account"}`);

            const toClient = createPublicClient({
                chain: client.chain,
                transport: http()
            });

            const toAccount = await createAccount(toClient, optionalPrivateKey as Address)

            const paymasterTo =
                await createPaymaster.getPaymasterData(token as Address, toAccount.account, toClient)

            const bundlerClientTo = bundlerClientFactory({
                account: toAccount.account,
                client: toClient,
                paymaster: {
                    getPaymasterData: async () => paymasterTo,
                },
            });

            const aproxToFee = chainName === "Arbitrum_Sepolia" ? 0.04 :
                chainName === "Optimism_Sepolia" ? 0.0025 : 0.003

            const authorization = await createAuthorization(toAccount.owner, toClient, toAccount.account)

            console.log("Lo q mandaria", amount)

            const hash = await bundlerClientTo.sendUserOperation({
                account: toAccount.account,
                calls: [
                    {
                        to: token as Address,
                        abi: usdcAbi,
                        functionName: "approve",
                        args: ["0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA", toUSDCBigInt(10000),],
                    },
                    {
                        to: token as Address,
                        abi: usdcAbi,
                        functionName: "transfer",
                        args: [to, amount - toUSDCBigInt(aproxToFee)],
                    }
                ],
                authorization: authorization,
            });

            console.log("UserOperation hash para supplier", hash);

            const receiptSuply = await bundlerClientTo.waitForUserOperationReceipt({ hash: hash });
            console.log("Transaction realizada", receiptSuply.receipt.transactionHash);

            return hash;
        };


        console.log("🔹 Starting main allocation loop");

        for (const allocation of routeSummary!.allocations) {
            console.log("Unlocking wallet for:", allocation.from);
            const unlocked = await unlockWallet(allocation.from, sendPassword);
            console.log("Wallet unlocked:", unlocked ? "✅" : "❌");

            for (const chain of allocation.chains) {
                console.log(chain)
                const fromValidChain =
                    chain.chainId === optimismSepolia.id.toString()
                        ? "Optimism_Sepolia"
                        : chain.chainId === arbitrumSepolia.id.toString()
                            ? "Arbitrum_Sepolia"
                            : "Base_Sepolia";

                const amount = parseUnits((chain.amount).toFixed(6), 6);
                console.log(`Processing chain ${fromValidChain} with amount ${chain.amount} (parsed: ${amount})`);

                if (fromValidChain === toValidChain) {
                    console.log(fromValidChain, toValidChain)
                    console.log("🟢 Same chain, transferring directly");
                    await transfer(fromValidChain, toAddress, amount, unlocked);
                    const delay = Math.floor(Math.random() * (7000 - 5000 + 1)) + 5000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    console.log(`⏱ Waited ${delay / 1000} seconds, continuing...`);
                } else {
                    console.log("🔵 Different chain, bridging via API");
                    await fetch("/api/bridge-usdc", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            amount: chain.amount,
                            fromChain: fromValidChain,
                            toChain: toValidChain,
                            recipient: toAddress, //account.address,
                            privateKey: unlocked,
                        }),
                    });
                    const delay = Math.floor(Math.random() * (5000 - 4000 + 1)) + 5000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                    console.log(`⏱ Waited ${delay / 1000} seconds, continuing...`);
                }
            }
        }

        /*console.log("🔹All allocations processed, sending final transfer to destination");

        const totalChains = routeSummary!.allocations.reduce((acc, a) => acc + a.chains.length, 0);

        // Sumar todos los montos originales
        const totalAmountRaw = routeSummary!.allocations
            .flatMap(a => a.chains.map(c => c.amount))
            .reduce((acc, n) => acc + n, 0);

        // Restar 0.01 por cada chain solo para el envío final
        const adjustedTotal = Math.max(totalAmountRaw - 0.01 * totalChains, 0);

        const finalAmount = parseUnits(adjustedTotal.toFixed(6), 6);
        console.log(`Original: ${totalAmountRaw}, Chains: ${totalChains}, Ajustado: ${adjustedTotal}`);

        await transfer(toValidChain, toAddress, finalAmount);*/
        console.log("✅ Final transfer completed");
    };

    const canSend =
    !!toAddress.trim() && !!sendAmount.trim() && !!sendPassword.trim();
  const chains = [
    { id: "Base_Sepolia", label: "Base", icon: <BaseIcon /> },
    { id: "Optimism_Sepolia", label: "Optimism", icon: <OPIcon /> },
    { id: "Arbitrum_Sepolia", label: "Arbitrum", icon: <ArbIcon /> },
  ];

  const resolveChain = (chainId: string | number) => {
    const idStr = String(chainId).toLowerCase();
    if (idStr === "Base_Sepolia" || idStr === "8453" || idStr === "84532") {
      return { label: "Base", icon: <BaseIcon /> };
    }
    if (idStr === "Optimism_Sepolia" || idStr === "10" || idStr === "11155420") {
      return { label: "Optimism", icon: <OPIcon /> };
    }
    if (idStr === "Arbitrum_Sepolia" || idStr === arbitrumSepolia.id.toString()) {
      return { label: "Arbitrum", icon: <ArbIcon /> };
    }
    return { label: idStr.toUpperCase(), icon: null };
  };

  const routeDetails =
    routeSummary?.allocations?.map((a) => ({
      wallet: a.from,
      walletName: walletNames?.[a.from.toLowerCase()] || a.from,
      chains: a.chains.map((c) => {
        const chainDef = resolveChain(c.chainId);
        return {
          id: c.chainId,
          label: chainDef.label,
          icon: chainDef.icon,
          amount: c.amount,
        };
      }),
    })) ?? [];

    const resetSendFields = () => {
        setToAddress("");
        setSendAmount("");
        setSendPassword("");
        setSendChain("Base_Sepolia");
        setSendLoading(false);
        setRouteReady(false);
        setRouteSummary(null);
    };

  return (
    <Dialog
      open={isOpen}
      onClose={() => {
          setSendModal(false);
          resetSendFields();
      }}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(15,23,42,0.25)",
        },
      }}
    >
      <Box
        sx={{
          background: "linear-gradient(135deg, #1f50ff 0%, #19a3b7 50%, #16a34a 100%)",
          px: 3,
          py: 2.2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          color: "#fff",
        }}
      >
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: 2.5,
            background: "rgba(255,255,255,0.14)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(6px)",
          }}
        >
          <SendIcon />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={900} fontSize={18.5} sx={{ lineHeight: 1.2 }}>
            Enviar fondos
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Elige la chain destino e ingresa address, monto y contrasena.
          </Typography>
        </Box>
      </Box>

      <DialogContent sx={{ px: 3, pb: 1.5, pt: 2.5 }}>
        {sendLoading && (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              borderRadius: 2,
              backgroundColor: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexDirection: "column",
              textAlign: "center",
            }}
          >
            <CircularProgress size={22} thickness={5} />
            <Typography fontWeight={800} fontSize={14}>
              Buscando la mejor ruta...
            </Typography>
            <Typography fontWeight={600} fontSize={13} color="text.secondary">
              Enviando transaccion...
            </Typography>
          </Box>
        )}
        {!routeReady ? (
          <Stack spacing={2.2}>
            <TextField
              select
              label="Chain destino"
              fullWidth
              size="medium"
              value={sendChain}
              onChange={(e) => setSendChain(e.target.value)}
              disabled={sendLoading}
            >
              {chains.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  <Stack direction="row" alignItems="center" spacing={1.2}>
                    {c.icon}
                    <Typography>{c.label}</Typography>
                  </Stack>
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Address destino"
              fullWidth
              size="medium"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder="0x..."
              disabled={sendLoading}
            />
            <TextField
              label="Monto"
              fullWidth
              size="medium"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              placeholder="0.00"
              type="number"
              inputProps={{ min: "0", step: "0.0001" }}
              disabled={sendLoading}
            />
            <TextField
              label="Password de la wallet"
              fullWidth
              size="medium"
              type="password"
              value={sendPassword}
              onChange={(e) => setSendPassword(e.target.value)}
              placeholder="********"
              disabled={sendLoading}
            />
          </Stack>
        ) : (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: "#f8fafc",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Typography fontWeight={800} fontSize={15}>
              Ruta encontrada
            </Typography>
            <Stack spacing={1}>
              {routeDetails.map((wallet) => (
                <Accordion
                  key={wallet.wallet}
                  disableGutters
                  elevation={0}
                  sx={{
                    backgroundColor: "#fff",
                    borderRadius: 1.5,
                    boxShadow: "0 8px 20px rgba(15,23,42,0.05)",
                    "&::before": { display: "none" },
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ width: "100%" }}
                      spacing={2}
                    >
                      <Box>
                        <Typography fontWeight={800}>{wallet.walletName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {wallet.wallet}
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography fontSize={12} color="text.secondary">
                          Total
                        </Typography>
                        <Typography fontWeight={800}>
                          {formatCurrency(
                            wallet.chains.reduce((acc, c) => acc + c.amount, 0),
                          )}
                        </Typography>
                      </Box>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1}>
                      {wallet.chains.map((r) => (
                        <Box
                          key={r.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 1,
                            borderRadius: 1,
                            backgroundColor: "#f8fafc",
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {r.icon}
                            <Typography fontWeight={700}>{r.label}</Typography>
                          </Stack>
                          <Box textAlign="right">
                              <Typography fontWeight={800}>
                                  {formatCurrency(
                                      r.amount
                                  )}
                              </Typography>

                              <Typography variant="body2" color="text.secondary">
                                  - {formatCurrency(
                                  r.id === arbitrumSepolia.id.toString()
                                      ? 0.032
                                      : r.id === optimismSepolia.id.toString()
                                          ? 0.0025
                                          : 0.003
                              )}
                              </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
            <Box
              sx={{
                mt: 1.5,
                p: 1.5,
                borderRadius: 1.5,
                backgroundColor: "#fff",
                boxShadow: "0 8px 20px rgba(15,23,42,0.05)",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Box>
                <Typography fontWeight={800}>Destinatario</Typography>
                <Typography variant="body2" color="text.secondary">
                  {routeReady || "N/D"}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                  {chains.find((c) => c.id === sendChain)?.icon}
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Llega en {chains.find((c) => c.id === sendChain)?.label || "Chain destino"}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
              <Box textAlign={{ xs: "left", sm: "right" }}>
                <Typography fontWeight={800}>Recibe</Typography>
                <Typography fontWeight={900}>{formatCurrency(Number(Math.max(
                    parseFloat(sendAmount || "0") - routeSummary!.totalFees - routeSummary?.commission! || 0
                ).toFixed(2)))}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Monto neto luego de comisión estimada
                </Typography>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
        <Button
          variant="outlined"
          onClick={() => {
              setSendModal(false);
              resetSendFields();
          }}
          sx={{
            textTransform: "none",
            borderRadius: 1.5,
            fontWeight: 700,
            borderColor: "#e2e8f0",
            color: "#0f172a",
            backgroundColor: "#fff",
            "&:hover": {
              borderColor: "#cbd5e1",
              backgroundColor: "#f8fafc",
            },
          }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={!canSend || sendLoading}
          sx={{
            textTransform: "none",
            borderRadius: 1.5,
            fontWeight: 800,
            letterSpacing: 0.2,
            boxShadow: "0 14px 35px rgba(26,146,255,0.35)",
            background: "linear-gradient(135deg, #0f7bff 0%, #0ac5a8 100%)",
            "&:hover": {
              background: "linear-gradient(135deg, #0d6bdc 0%, #09ad93 100%)",
            },
          }}
        >
          {sendLoading ? "Aceptar" : routeReady ? "Enviar" : "Aceptar"}
        </Button>
          <Button
            onClick={handleOnTest}
          >
              HOLI
          </Button>
      </DialogActions>
    </Dialog>
  );
}
