import { createAccount } from "@/app/cross-chain-core/clientFactory";
import { Address } from "abitype";
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
        const networkConfig = NETWORKS[toChain];
        const evmConfig = networkConfig.evm;

        if (!evmConfig) {
            console.error(`Chain ${toChain} is not an EVM chain`);
            return;
        }

        const toClient = createPublicClient({
            chain: evmConfig.chain,
            transport: http(evmConfig.rpcUrl as string | undefined),
        });

        // Cuenta principal de destino
        const toAccount = await createAccount(toClient, privateKey);

        bridgeEmitter.emit("chain-step", {
            chain: fromChain,
            step: "burning",
            message: "Quemando USDC...",
            wallet: toAccount.owner.address,
        });

        // Domain is now nested in circleInformation -> cCTPInformation -> domain
        const domain = networkConfig.crossChainInformation.circleInformation?.cCTPInformation?.domain;

        if (domain === undefined) {
            console.error(`CCTP Domain not found for chain ${toChain}`);
            return;
        }

        await approveAndBurn(
            privateKey,
            amount,
            domain,
            recipient,
            fromChain
        );

        // Paymaster para account principal
        bridgeEmitter.emit("chain-step", {
            chain: fromChain,
            step: "done",
            message: "Transferencia finalizada",
            wallet: toAccount.owner.address,
        });
    } catch (e) {
        console.log(e);
    }
};
