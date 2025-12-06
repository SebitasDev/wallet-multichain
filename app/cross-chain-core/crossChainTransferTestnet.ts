
import {createAccount} from "@/app/cross-chain-core/clientFactory";
import {Address} from "abitype";
import {createPaymaster} from "@/app/cross-chain-core/paymasterFactory";
import {bundlerClientFactory} from "@/app/cross-chain-core/bundlerClientFactory";
import {usdcAbi} from "@/app/cross-chain-core/usdcAbi";
import {createPublicClient, http} from "viem";
import {createAuthorization} from "@/app/cross-chain-core/autorizationFactory";
import {ChainKey, NETWORKS} from "@/app/constants/chainsInformation";
import {toUSDCBigInt} from "@/app/utils/toUSDCBigInt";
import {approveAndBurn} from "@/app/cross-chain-core/functions/approveAndBurn";
import bridgeEmitter from "@/app/lib/bridgeEmitter";

export const crossChainTransferTestnet = async (
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
            transport: http()
        });

        const toAccount = await createAccount(toClient, privateKey)

        const toAccountSupplier = await createAccount(toClient, process.env.SUPLAYER_PRIVATE_KEY! as Address)

        const paymasterToSupplier =
            await createPaymaster.getPaymasterData(usdcAddressTo, toAccountSupplier.account, toClient);

        const bundlerClientToSupplier = bundlerClientFactory({
            account: toAccount.account,
            client: toClient,
            paymaster: {
                getPaymasterData: async () => paymasterToSupplier,
            },
        });

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
        )

        bridgeEmitter.emit("chain-step", {
            chain: fromChain,
            step: "minting",
            message: "Ejecutando mint en chain destino...",
            wallet: toAccount.owner.address,
        });

        async function safeMint() {
            const transmitter = "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275";

            const authorizationSupplier = await createAuthorization(toAccountSupplier.owner, toClient, toAccountSupplier.account)

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
                authorization: authorizationSupplier
            });
            console.log("UserOperation hash para supplier", hashSupplierUser);

            const receiptSuply = await bundlerClientToSupplier.waitForUserOperationReceipt({ hash: hashSupplierUser });
            console.log("Transaction hash supliendo al usuario que manda", receiptSuply.receipt.transactionHash);

            const paymasterTo =
                await createPaymaster.getPaymasterData(usdcAddressTo, toAccount.account, toClient)

            const bundlerClientTo = bundlerClientFactory({
                account: toAccount.account,
                client: toClient,
                paymaster: {
                    getPaymasterData: async () => paymasterTo,
                },
            });

            const auth = await createAuthorization(toAccount.owner, toClient, toAccount.account)

            const hashMintGas = await bundlerClientTo.estimateUserOperationGas({
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
            });

            console.log("Transaction hash para supplier aprox gas", hashMintGas);

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
                authorization: auth
            });

            /*const hashMintGas = await bundlerClientTo.estimateUserOperationGas({
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
                        args: [approveAndBurnAttestation.message, approveAndBurnAttestation.attestation],
                    },
                ],
                authorization: aut
            });

            console.log("Transaction hash para supplier aprox gas", hashMintGas);*/

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
            } catch (err) {
                // @ts-ignore
                console.warn("No pude esperar receipt o falló (pero el hash fue enviado):", err.message);
                return { hash: hashMint };
            }
        }

        return await safeMint();
    } catch (e) {
        console.log(e)
    }
}
