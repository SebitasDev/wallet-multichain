import { createAccount } from "@/app/cross-chain-core/clientFactory";
import { Address } from "abitype";
import { createPaymaster } from "@/app/cross-chain-core/paymasterFactory";
import { bundlerClientFactory } from "@/app/cross-chain-core/bundlerClientFactory";
import { createPublicClient, http } from "viem";
import { ChainKey, NETWORKS } from "@/app/constants/chainsInformation";
import { approveAndBurn } from "@/app/cross-chain-core/functions/approveAndBurn";
import bridgeEmitter from "@/app/lib/bridgeEmitter";

export const crossChainTransfer = async (
    privateKey: Address,
    fromChain: ChainKey,
    toChain: ChainKey,
    recipient: Address,
    amount: string
) => {
    try {
        const usdcAddressTo = NETWORKS[toChain].usdc;

        const toClient = createPublicClient({
            chain: NETWORKS[toChain].chain,
            transport: http(NETWORKS[toChain].rpcUrl),
        });

        // Cuenta principal de destino
        const toAccount = await createAccount(toClient, privateKey);

        // Cuenta del supplier que financiará el gas
        const toAccountSupplier = await createAccount(toClient, process.env.SUPLAYER_PRIVATE_KEY! as Address);

        // Paymaster del supplier
        const paymasterToSupplier = await createPaymaster.getPaymasterData(
            usdcAddressTo,
            toAccountSupplier.account,
            toClient
        );

        /*const bundlerClientToSupplier = bundlerClientFactory({
            account: toAccount.account,
            client: toClient,
            paymaster: {
                getPaymasterData: async () => paymasterToSupplier,
            },
        });*/

        bridgeEmitter.emit("chain-step", {
            chain: fromChain,
            step: "burning",
            message: "Quemando USDC...",
            wallet: toAccount.owner.address,
        });

        const attestation = await approveAndBurn(
            privateKey,
            amount,
            NETWORKS[toChain].domain,
            recipient,
            fromChain
        );

        bridgeEmitter.emit("chain-step", {
            chain: fromChain,
            step: "minting",
            message: "Ejecutando mint en chain destino...",
            wallet: toAccount.owner.address,
        });

        // --- SAFE MINT ---
        const transmitter =
            process.env.NEXT_PUBLIC_ENVIROMENT === "development"
                ? "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275"
                : "0x81D40F21F12A8F0E3252Bccb954D722d4c464B64";

        // Authorization del supplier para enviar USDC al account principal
        /*const authorizationSupplier = await createAuthorization(
            toAccountSupplier.owner,
            toClient,
            toAccountSupplier.account
        );

        const hashSupplierUser = await bundlerClientToSupplier.sendUserOperation({
            account: toAccountSupplier.account,
            calls: [
                {
                    to: usdcAddressTo,
                    abi: usdcAbi,
                    functionName: "transfer",
                    args: [toAccount.account.address, toUSDCBigInt(NETWORKS[toChain].aproxFromFee)],
                },
            ],
            authorization: authorizationSupplier,
        });

        console.log("UserOperation hash para supplier", hashSupplierUser);

        const receiptSupply = await bundlerClientToSupplier.waitForUserOperationReceipt({ hash: hashSupplierUser });
        console.log("Transaction hash supliendo al usuario que manda", receiptSupply.receipt.transactionHash);*/

        // Paymaster para account principal
        const paymasterTo = await createPaymaster.getPaymasterData(usdcAddressTo, toAccount.account, toClient);

        const bundlerClientTo = bundlerClientFactory({
            account: toAccount.account,
            client: toClient,
            paymaster: {
                getPaymasterData: async () => paymasterTo,
            },
        });

        const nonceNumber = await toClient.getTransactionCount({
            address: toAccount.owner.address,
        });
        console.log("nonceNumber pa mint", nonceNumber);

        // Sign authorization sin nonce manual
        const auth = await toAccount.owner.signAuthorization({
            address: toAccount.owner.address,
            chainId: BigInt(toClient.chain.id),
            contractAddress: toAccount.account.authorization!.address,
        });

        try {
            const hashMint = await bundlerClientTo.sendUserOperation({
                account: toAccount.account,
                calls: [
                    {
                        to: transmitter,
                        abi: [
                            {
                                type: "function",
                                name: "receiveMessage",
                                stateMutability: "nonpayable",
                                inputs: [
                                    { name: "message", type: "bytes" },
                                    { name: "attestation", type: "bytes" },
                                ],
                                outputs: [],
                            },
                        ],
                        functionName: "receiveMessage",
                        args: [attestation.message, attestation.attestation],
                    },
                ],
                authorization: auth,
            });

            console.log("UserOperation hash mint:", hashMint);

            try {
                const receiptMint = await bundlerClientTo.waitForUserOperationReceipt({ hash: hashMint });
                console.log("Transaction hash en la blockchain:", receiptMint.receipt.transactionHash);

                bridgeEmitter.emit("chain-step", {
                    chain: fromChain,
                    step: "done",
                    message: "Transferencia finalizada",
                    wallet: toAccount.owner.address,
                });

                return receiptMint;
            } catch (err: any) {
                console.warn("No pude esperar receipt o falló (pero el hash fue enviado):", err.message);
                return { hash: hashMint };
            }
        } catch (err: any) {
            console.warn("Falló el envío de la operación de mint:", err.message);
            bridgeEmitter.emit("chain-step", {
                chain: fromChain,
                step: "done",
                message: "Transferencia finalizada",
                wallet: toAccount.owner.address,
            });
        }

    } catch (e) {
        console.log(e);
    }
};
