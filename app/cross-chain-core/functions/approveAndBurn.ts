import {Address} from "abitype";
import {usdcAbi} from "@/app/cross-chain-core/usdcAbi";
import {toUSDCBigInt} from "@/app/utils/toUSDCBigInt";
import {createAuthorization} from "@/app/cross-chain-core/autorizationFactory";
import {createAccount} from "@/app/cross-chain-core/clientFactory";
import {createPaymaster} from "@/app/cross-chain-core/paymasterFactory";
import {bundlerClientFactory} from "@/app/cross-chain-core/bundlerClientFactory";
import {createRetrieveAttestation} from "@/app/cross-chain-core/retrieveAttestationFactory";
import {ChainKey, NETWORKS} from "@/app/constants/chainsInformation";
import {getTokenMessenger} from "@/app/facilitator/config";
import {tokenMessengerAbi} from "@/app/facilitator/cctpAbi";
import {createPublicClient, http, maxUint256} from "viem";

export const approveAndBurn = async (
    privateKey: Address,
    amount: string,
    domain: number,
    recipient: Address,
    fromChain: ChainKey
) => {

    const client = createPublicClient({
        chain: NETWORKS[fromChain].chain,
        transport: http(NETWORKS[fromChain].rpcUrl)
    });

    const account = await createAccount(client, privateKey)

    const usdcAddress = NETWORKS[fromChain].usdc;
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

    const hash = await bundlerClient.sendUserOperation({
        account: account.account,
        calls: [
            {
                to: usdcAddress,
                abi: usdcAbi,
                functionName: "approve",
                args: [tokenMessenger, maxUint256],
            },
            {
                to: tokenMessenger,
                abi: tokenMessengerAbi,
                functionName: "depositForBurn",
                args: [
                    toUSDCBigInt(Number(amount)),
                    domain,
                    `0x000000000000000000000000${recipient.slice(2)}`,
                    usdcAddress,
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    BigInt(5000),
                    1000,
                ],
            },
            {
                to: usdcAddress,
                abi: usdcAbi,
                functionName: "transfer",
                args: [process.env.ADDRESS_ACCOUNT_WIN_COMISION, toUSDCBigInt(0.01)],
            }
        ],
        authorization,
    });

    console.log("UserOperation hash approve and burn:", hash);

    const receiptApproveAndBurn = await bundlerClient.waitForUserOperationReceipt({ hash });
    console.log("Transaction hash en la blockchain de approve y burn:", receiptApproveAndBurn.receipt.transactionHash);

    return  await createRetrieveAttestation(receiptApproveAndBurn.receipt.transactionHash, NETWORKS[fromChain].domain.toString())


}