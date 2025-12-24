import {
    createWalletClient,
    createPublicClient,
    custom,
    http,
    getContract,
    toHex,
    keccak256
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
    FacilitatorChainKey,
    calculateTotalWithFee
} from "@/app/facilitator/config";
import { FACILITATOR_NETWORKS } from "@/app/facilitator/evm/config";
import { usdcErc3009Abi, TransferWithAuthorizationTypes } from "@/app/facilitator/evm/usdcErc3009Abi";
import { FacilitatorPaymentPayload } from "@/app/facilitator/types";
import { Address } from "abitype";

const FACILITATOR_ADDRESS = process.env.NEXT_PUBLIC_FACILITATOR_ADDRESS as Address;
const LOG_PREFIX = "[Facilitator EVM Auth]";

/** Generates a random nonce for ERC-3009 authorization */
export const generateNonce = (): `0x${string}` => {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    return keccak256(toHex(randomBytes));
};

export const createAuthorizationPayload = async (
    amount: bigint,
    sourceChain: FacilitatorChainKey,
    userAddress: Address,
    provider?: any,
    privateKey?: `0x${string}`
): Promise<FacilitatorPaymentPayload> => {
    const networkConfig = FACILITATOR_NETWORKS[sourceChain];
    if (!networkConfig) throw new Error(`Unsupported chain: ${sourceChain}`);

    // The amount passed here is already the TOTAL amount (User Amount + Fee)
    // calculated by the consumer (useCrossChainTransfer).
    // We should NOT add the fee again.
    const totalAmount = amount;

    const publicClient = createPublicClient({
        chain: networkConfig.chain,
        transport: http(networkConfig.rpcUrl)
    });

    const usdcContract = getContract({
        address: networkConfig.usdc,
        abi: usdcErc3009Abi,
        client: publicClient
    });

    const [usdcName, usdcVersion] = await Promise.all([
        usdcContract.read.name(),
        usdcContract.read.version()
    ]);

    const nonce = generateNonce();
    const validAfter = BigInt(0);
    const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600);

    const destinationAddress = FACILITATOR_ADDRESS;

    const authorization = {
        from: userAddress,
        to: destinationAddress,
        value: totalAmount.toString(),
        validAfter: validAfter.toString(),
        validBefore: validBefore.toString(),
        nonce
    };

    const domain = {
        name: usdcName as string,
        version: usdcVersion as string,
        chainId: networkConfig.chainId,
        verifyingContract: networkConfig.usdc
    };

    const message = {
        from: userAddress,
        to: destinationAddress,
        value: totalAmount,
        validAfter,
        validBefore,
        nonce
    };

    console.log(LOG_PREFIX, "Creating ERC-3009 authorization", {
        from: userAddress,
        to: destinationAddress,
        amount: totalAmount.toString(),
        chain: sourceChain
    });

    let signature: `0x${string}`;

    if (provider) {
        console.log(LOG_PREFIX, "Signing with external provider");
        const walletClient = createWalletClient({
            chain: networkConfig.chain,
            transport: custom(provider),
            account: userAddress
        });

        signature = await walletClient.signTypedData({
            domain,
            types: TransferWithAuthorizationTypes,
            primaryType: "TransferWithAuthorization",
            message
        });
    } else if (privateKey) {
        console.log(LOG_PREFIX, "Signing with local key");
        const account = privateKeyToAccount(privateKey);
        const walletClient = createWalletClient({
            account,
            chain: networkConfig.chain,
            transport: http(networkConfig.rpcUrl)
        });

        signature = await walletClient.signTypedData({
            domain,
            types: TransferWithAuthorizationTypes,
            primaryType: "TransferWithAuthorization",
            message
        });
    } else {
        throw new Error("No provider or private key provided");
    }

    console.log(LOG_PREFIX, "Authorization signed successfully");

    return {
        authorization,
        signature,
        sourceChain,
        domainName: usdcName as string,
        domainVersion: usdcVersion as string
    };
};
