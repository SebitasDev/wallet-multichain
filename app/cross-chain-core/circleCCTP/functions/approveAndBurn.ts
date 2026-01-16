import { Address } from "abitype";
import { usdcAbi } from "@/app/cross-chain-core/circleCCTP/usdcAbi";
import { toUSDCBigInt } from "@/app/utils/toUSDCBigInt";
import { createAuthorization } from "@/app/cross-chain-core/circleCCTP/autorizationFactory";
import { createAccount } from "@/app/cross-chain-core/circleCCTP/clientFactory";
import { createPaymaster } from "@/app/cross-chain-core/circleCCTP/paymasterFactory";
import { bundlerClientFactory } from "@/app/cross-chain-core/circleCCTP/bundlerClientFactory";
import { createRetrieveAttestation } from "@/app/cross-chain-core/circleCCTP/retrieveAttestationFactory";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { ChainKey } from "@/app/types/chain";
import { getTokenMessenger } from "@/app/facilitator/evm/config";
import { tokenMessengerAbi } from "@/app/facilitator/evm/cctpAbi";
import { createPublicClient, http, maxUint256 } from "viem";

export const approveAndBurn = async (
    privateKey: Address,
    amount: string,
    domain: number,
    recipient: Address,
    fromChain: ChainKey
) => {

    const network = NETWORKS[fromChain];
    const evmConfig = network.evm;

    if (!evmConfig) {
        throw new Error(`Chain ${fromChain} is not configured for EVM operations`);
    }

    const client = createPublicClient({
        chain: evmConfig.chain,
        transport: http(evmConfig.rpcUrl as string | undefined)
    });

    const account = await createAccount(client, privateKey)

    const usdcAddress = network.assets.find(a => a.name === "USDC")?.address as Address;
    if (!usdcAddress) {
        throw new Error("USDC address not found");
    }

    const tokenMessenger = getTokenMessenger();

    const paymaster = await createPaymaster.getPaymasterData(usdcAddress, account.account, client)

    const bundlerClient = bundlerClientFactory({
        account: account.account,
        client: client,
        paymaster: {
            getPaymasterData: async () => paymaster,
        },
    });

    const authorization = await createAuthorization(account.owner, client, account.account)

    // Calcular el monto en unidades atómicas
    const amountAtomic = toUSDCBigInt(Number(amount));

    // maxFee debe ser menor que el amount - usar 1% del monto o mínimo 100 (0.0001 USDC)
    // Si el monto es muy pequeño, usar 0 como maxFee
    const maxFee = amountAtomic > BigInt(100)
        ? BigInt(Math.floor(Math.min(Number(amountAtomic) / 100, 5000))) // 1% del monto, máximo 0.005 USDC
        : BigInt(0);

    console.log("Amount atomic:", amountAtomic.toString());
    console.log("Max fee:", maxFee.toString());

    // Verificar si ya tiene allowance para evitar el approve innecesario
    const currentAllowance = await client.readContract({
        address: usdcAddress,
        abi: usdcAbi,
        functionName: "allowance",
        args: [account.account.address, tokenMessenger]
    }) as bigint;

    const needsApprove = currentAllowance < amountAtomic;
    console.log("Current allowance:", currentAllowance.toString());
    console.log("Needs approve:", needsApprove);

    // Construir las calls dinámicamente
    const calls: any[] = [];

    // Solo agregar approve si es necesario
    if (needsApprove) {
        calls.push({
            to: usdcAddress,
            abi: usdcAbi,
            functionName: "approve",
            args: [tokenMessenger, maxUint256],
        });
    }

    // Siempre agregar depositForBurn
    calls.push({
        to: tokenMessenger,
        abi: tokenMessengerAbi,
        functionName: "depositForBurn",
        args: [
            amountAtomic,
            domain,
            `0x000000000000000000000000${recipient.slice(2)}`,
            usdcAddress,
            "0x0000000000000000000000000000000000000000000000000000000000000000",
            maxFee,
            1000,
        ],
    });

    console.log("Total calls:", calls.length);

    const hash = await bundlerClient.sendUserOperation({
        account: account.account,
        calls,
        authorization,
    });

    console.log("UserOperation hash approve and burn:", hash);

    const receiptApproveAndBurn = await bundlerClient.waitForUserOperationReceipt({ hash });
    console.log("Transaction hash en la blockchain de approve y burn:", receiptApproveAndBurn.receipt.transactionHash);

    const domainStr = network.crossChainInformation.circleInformation?.cCTPInformation?.domain?.toString();
    if (!domainStr) throw new Error("CCTP Domain not found");

    return await createRetrieveAttestation(receiptApproveAndBurn.receipt.transactionHash, domainStr);


}