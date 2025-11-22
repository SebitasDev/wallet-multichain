// utils/bridgeCircle.ts
import "dotenv/config";
import {BridgeKit, TransferSpeed} from "@circle-fin/bridge-kit";
import {ChainIdentifier, createAdapterFromPrivateKey} from "@circle-fin/adapter-viem-v2";
import {inspect} from "util";
import {Address} from "abitype";
import {estimateBridge} from "@/app/utils/gasEstimation";

const kit = new BridgeKit();

/**
 * bridgeUSDC - Transfiere USDC desde una chain origen a una chain destino usando Circle CCTP
 * @param privateKey Wallet privada del usuario (server-side)
 * @param fromChain Nombre de la chain origen según BridgeKit
 * @param toChain Nombre de la chain destino según BridgeKit
 * @param amount Cantidad de USDC a transferir (ej: "1.00")
 * @returns Resultado de la transferencia o null en caso de error
 */
export const bridgeUSDC = async (
    privateKey: string,
    fromChain: ChainIdentifier,
    toChain: ChainIdentifier,
    recipient: Address,
    amount: string
) => {
    try {
        const adapter = createAdapterFromPrivateKey({ privateKey });

        console.log("---------------Starting Bridging---------------");

        console.log(amount)

        const gasEstimation = await estimateBridge({
            from: { adapter, chain: toChain },
            to: {
                adapter,
                chain: fromChain,
                recipientAddress: recipient
            },
            amount,
            config: {
                transferSpeed: TransferSpeed.FAST
            }
        })

        console.log(gasEstimation)

        const result = await kit.bridge({
            from: { adapter, chain: fromChain },
            to: {
                adapter,
                chain: toChain,
                recipientAddress: recipient
            },
            amount,
            config: {
                transferSpeed: TransferSpeed.FAST,
                customFee: {
                    recipientAddress: "0x49fc88d0e7972e8a470ec21D42d44f751C3b7D47",
                    value: '0.1'
                },
            }
        });

        console.log("RESULT", inspect(result, false, null, true));

        return result;
    } catch (err) {
        console.log("ERROR", inspect(err, false, null, true));
        return null;
    }
};
