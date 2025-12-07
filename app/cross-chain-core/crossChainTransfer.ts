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
        const toClient = createPublicClient({
            chain: NETWORKS[toChain].chain,
            transport: http(NETWORKS[toChain].rpcUrl),
        });

        // Cuenta principal de destino
        const toAccount = await createAccount(toClient, privateKey);

        bridgeEmitter.emit("chain-step", {
            chain: fromChain,
            step: "burning",
            message: "Quemando USDC...",
            wallet: toAccount.owner.address,
        });

        await approveAndBurn(
            privateKey,
            amount,
            NETWORKS[toChain].domain,
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
