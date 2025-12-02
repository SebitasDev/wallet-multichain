import {
    createBundlerClient,
    type BundlerClient,
    type SmartAccount,
    type PaymasterActions,
} from "viem/account-abstraction";
import {
    type Chain,
    type Client,
    hexToBigInt,
    http,
} from "viem";

export interface BundlerClientFactoryParams {
    account: SmartAccount;
    client: Client & { chain: Chain };

    // 👇 Paymaster debe ser funciones, NO un resultado
    paymaster?: true | {
        getPaymasterData?: PaymasterActions["getPaymasterData"];
        getPaymasterStubData?: PaymasterActions["getPaymasterStubData"];
    };
}

export const bundlerClientFactory = ({account, client, paymaster,}: BundlerClientFactoryParams): BundlerClient => {

    return createBundlerClient({
        account,
        client,
        paymaster,
        userOperation: {
            estimateFeesPerGas: async ({ bundlerClient }) => {
                // @ts-ignore
                const { standard: fees } = await bundlerClient.request({
                    method: "pimlico_getUserOperationGasPrice" as any,
                });

                return {
                    maxFeePerGas: hexToBigInt(fees.maxFeePerGas),
                    maxPriorityFeePerGas: hexToBigInt(fees.maxPriorityFeePerGas),
                };
            },
        },
        transport: http(`https://api.pimlico.io/v2/${client.chain.id}/rpc?apikey=pim_7djYZx8kbohkN2ix2yNY1k`),
    });
};
