"use client";

import { useEffect, useState } from "react";
import { Box, Typography, TextField, Button, MenuItem, Paper, Stack, Divider, CircularProgress, Alert } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { createWalletClient, http, createPublicClient } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

import { useXOWalletStore } from "@/app/store/useXOWalletStore";
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { decryptPrivateKey } from "@/app/utils/cripto";
import { PasswordModal } from "@/app/dashboard/components/PasswordModal";

// USDC Address on Base
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

type TestFormValues = {
    endpoint: string;
    sourceChain: string;
    amount: string;
    recipientStellar: string;
    recipientOther?: string;
};

export default function ApiTestPage() {
    // Auth State
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [apiResponse, setApiResponse] = useState<any>(null);

    // Config State
    const [facilitatorAddress, setFacilitatorAddress] = useState<string>("");
    const [configLoading, setConfigLoading] = useState(true);

    // Form
    const { control, handleSubmit, watch, getValues } = useForm<TestFormValues>({
        defaultValues: {
            endpoint: "xlm", // 'xlm' or 'usdc'
            sourceChain: "Base",
            amount: "1",
            recipientStellar: "",
            recipientOther: "",
        }
    });

    const endpoint = watch("endpoint");

    // 0. Fetch Config on Mount
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch("/api/bridge/stellar");
                if (!res.ok) throw new Error("Failed to fetch bridge config");
                const data = await res.json();
                if (data.evmAddress) {
                    setFacilitatorAddress(data.evmAddress);
                } else {
                    toast.error("Facilitator EVM Address not found in config");
                }
            } catch (err) {
                console.error(err);
                toast.error("Error loading bridge configuration");
            } finally {
                setConfigLoading(false);
            }
        };
        fetchConfig();
    }, []);

    // 1. Trigger Auth Flow
    const handleStartParams = () => {
        const { mainWallet } = useXOWalletStore.getState();
        if (!mainWallet || !mainWallet.address) {
            toast.error("No Main Wallet found. Please create one in Dashboard.");
            return;
        }
        if (!facilitatorAddress) {
            toast.error("Facilitator address not loaded. Cannot proceed.");
            return;
        }
        setPasswordModalOpen(true);
    };

    // 2. On Auth Success -> Sign & Send
    const handleAuthSuccess = async () => {
        setPasswordModalOpen(false);
        setLoading(true);
        setApiResponse(null);

        try {
            const values = getValues();
            const { mainWallet } = useXOWalletStore.getState();
            const { currentPassword } = useWalletPasswordStore.getState();

            if (!mainWallet || !currentPassword) {
                throw new Error("Wallet or Password not available after auth.");
            }

            // Decrypt Private Key
            const { encryptedPrivateKey, salt, iv } = mainWallet;
            if (!encryptedPrivateKey || !salt || !iv) {
                throw new Error("Main Wallet is missing encryption data.");
            }

            const privateKey = await decryptPrivateKey(encryptedPrivateKey, currentPassword, salt, iv);
            if (!privateKey) {
                throw new Error("Failed to decrypt private key.");
            }

            console.log(">>> Wallet Authenticated. Signing...");

            // Setup Client
            // @ts-ignore
            const account = privateKeyToAccount(privateKey as `0x${string}`);

            const walletClient = createWalletClient({
                account,
                chain: base,
                transport: http()
            });

            // Prepare EIP-3009
            const value = BigInt(Math.floor(parseFloat(values.amount) * 1_000_000)); // 6 decimals
            const validAfter = BigInt(0);
            const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour
            const nonce = crypto.getRandomValues(new Uint8Array(32));
            const nonceHex = "0x" + Buffer.from(nonce).toString('hex') as `0x${string}`;

            const domain = {
                name: "USD Coin",
                version: "2",
                chainId: base.id,
                verifyingContract: USDC_BASE as `0x${string}`,
            };

            const types = {
                TransferWithAuthorization: [
                    { name: "from", type: "address" },
                    { name: "to", type: "address" },
                    { name: "value", type: "uint256" },
                    { name: "validAfter", type: "uint256" },
                    { name: "validBefore", type: "uint256" },
                    { name: "nonce", type: "bytes32" },
                ],
            };

            const message = {
                from: account.address,
                to: facilitatorAddress as `0x${string}`,
                value,
                validAfter,
                validBefore,
                nonce: nonceHex,
            };

            console.log("Signing EIP-3009 data...", message);

            const signature = await walletClient.signTypedData({
                domain,
                types,
                primaryType: "TransferWithAuthorization",
                message,
            });

            console.log("Signature generated:", signature);

            // API Payload
            const payload = {
                sourceChain: values.sourceChain,
                targetChain: "Stellar",
                amount: values.amount,
                recipientStellar: values.recipientStellar,
                recipientOther: values.recipientOther,
                destinationToken: endpoint === "xlm" ? "XLM" : "USDC",
                paymentPayload: {
                    authorization: {
                        from: account.address,
                        to: facilitatorAddress,
                        value: value.toString(),
                        validAfter: validAfter.toString(),
                        validBefore: validBefore.toString(),
                        nonce: nonceHex
                    },
                    signature
                }
            };

            const targetEndpoint = endpoint === "xlm" ? "/api/bridge/stellar/xlm" : "/api/bridge/stellar/usdc";

            console.log(`Sending to API ${targetEndpoint}...`, payload);

            const response = await fetch(targetEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const responseData = await response.json();
            setApiResponse(responseData);

            if (response.ok) {
                toast.success("Bridge initiated successfully!");
            } else {
                toast.error("Bridge failed: " + (responseData.errorReason || "Unknown error"));
            }

        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Error occurred");
            setApiResponse({ error: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", p: 4, background: "#f5f5f5" }}>
            <ToastContainer />
            <Box sx={{ maxWidth: 600, mx: "auto" }}>
                <Typography variant="h4" fontWeight={900} gutterBottom>
                    Bridge API Test
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                    Test the new Stellar Bridge endpoints using Main Wallet.
                </Typography>

                <Paper sx={{ p: 4, borderRadius: 4, border: "1px solid #ccc" }}>
                    <Stack spacing={3}>

                        {configLoading && <CircularProgress size={20} />}

                        {!configLoading && facilitatorAddress && (
                            <Alert severity="info" sx={{ fontSize: 12 }}>
                                Facilitator: <b>{facilitatorAddress}</b>
                            </Alert>
                        )}

                        {!configLoading && !facilitatorAddress && (
                            <Alert severity="error">
                                Facilitator address could not be loaded. Please check API config.
                            </Alert>
                        )}

                        {/* ENDPOINT SELECTOR */}
                        <Controller
                            name="endpoint"
                            control={control}
                            render={({ field }) => (
                                <TextField {...field} select label="Target Endpoint" fullWidth>
                                    <MenuItem value="xlm">/api/bridge/stellar/xlm (USDC → XLM)</MenuItem>
                                    <MenuItem value="usdc">/api/bridge/stellar/usdc (USDC → USDC)</MenuItem>
                                </TextField>
                            )}
                        />

                        {/* SOURCE CHAIN */}
                        <Controller
                            name="sourceChain"
                            control={control}
                            render={({ field }) => (
                                <TextField {...field} select label="Source Chain" fullWidth>
                                    <MenuItem value="Base">Base</MenuItem>
                                    {/* Add others if needed */}
                                </TextField>
                            )}
                        />

                        {/* AMOUNT */}
                        <Controller
                            name="amount"
                            control={control}
                            render={({ field }) => (
                                <TextField {...field} label="Amount (USDC)" type="number" fullWidth />
                            )}
                        />

                        {/* RECIPIENT STELLAR */}
                        <Controller
                            name="recipientStellar"
                            control={control}
                            render={({ field }) => (
                                <TextField {...field} label="Stellar Recipient Address (G...)" fullWidth />
                            )}
                        />

                        <Divider />

                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleSubmit(handleStartParams)}
                            disabled={loading || !facilitatorAddress}
                            sx={{
                                background: "#000",
                                color: "#fff",
                                py: 2,
                                fontWeight: "bold",
                                "&:hover": { background: "#333" }
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : "Sign & Send Request"}
                        </Button>

                        {/* API RESPONSE */}
                        {apiResponse && (
                            <Box sx={{ mt: 3, p: 2, background: "#eee", borderRadius: 2, overflowX: "auto" }}>
                                <Typography variant="overline" fontWeight="bold">API Response:</Typography>
                                <pre style={{ fontSize: 12 }}>
                                    {JSON.stringify(apiResponse, null, 2)}
                                </pre>
                            </Box>
                        )}

                    </Stack>
                </Paper>
            </Box>

            <PasswordModal
                open={passwordModalOpen}
                mode="unlock"
                onSuccess={handleAuthSuccess}
                onClose={() => setPasswordModalOpen(false)}
            />
        </Box>
    );
}
