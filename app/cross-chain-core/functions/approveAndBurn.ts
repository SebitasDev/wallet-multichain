import {Address} from "abitype";
import {usdcAbi} from "@/app/cross-chain-core/usdcAbi";
import {toUSDCBigInt} from "@/app/utils/toUSDCBigInt";
import {createAuthorization} from "@/app/cross-chain-core/autorizationFactory";
import {createAccount} from "@/app/cross-chain-core/clientFactory";
import {createPaymaster} from "@/app/cross-chain-core/paymasterFactory";
import {bundlerClientFactory} from "@/app/cross-chain-core/bundlerClientFactory";
import {createRetrieveAttestation} from "@/app/cross-chain-core/retrieveAttestationFactory";
import {ChainKey, NETWORKS} from "@/app/constants/chainsInformation";
import {createPublicClient, http} from "viem";

export const approveAndBurn = async (
    privateKey: Address,
    amount: string,
    domain: number,
    recipient: Address,
    fromChain: ChainKey
) => {

    const client = createPublicClient({
        chain: NETWORKS[fromChain].chain,
        transport: http()
    });

    const account = await createAccount(client, privateKey)

    const usdcAddress = NETWORKS[fromChain].usdc;

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
                args: ["0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA", toUSDCBigInt(10000),],
            },
            {
                to: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
                abi: [
                    {
                        type: "function",
                        name: "depositForBurn",
                        stateMutability: "nonpayable",
                        inputs: [
                            { name: "amount", type: "uint256" },
                            { name: "destinationDomain", type: "uint32" },
                            { name: "mintRecipient", type: "bytes32" },
                            { name: "burnToken", type: "address" },
                            { name: "destinationCaller", type: "bytes32" },
                            { name: "maxFee", type: "uint256" },
                            { name: "minFinalityThreshold", type: "uint32" },
                        ],
                        outputs: [],
                    },
                ],
                functionName: "depositForBurn",
                args: [
                    toUSDCBigInt(Number(amount)),
                    domain,
                    `0x000000000000000000000000${recipient.slice(2)}`,
                    usdcAddress,
                    "0x0000000000000000000000000000000000000000000000000000000000000000",
                    BigInt(500),
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