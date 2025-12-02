import {
    Address,
    Hex,
    maxUint256,
    erc20Abi,
    parseErc6492Signature,
    getContract,
    PublicClient,
    TypedDataDefinition,
} from "viem";
import {SmartAccount} from "viem/account-abstraction";

// -----------------------------------------------
// TIPOS
// -----------------------------------------------

export type Eip2612Contract = ReturnType<
    typeof getContract
>;

export interface Eip2612PermitArgs {
    token: Eip2612Contract;
    chain: { id: number };
    ownerAddress: Address;
    spenderAddress: Address;
    value: bigint;
}

export interface SignPermitArgs {
    tokenAddress: Address;
    client: PublicClient;
    account: SmartAccount;
    spenderAddress: Address;
    permitAmount: bigint;
}

// -----------------------------------------------
// PERMIT BUILDER
// -----------------------------------------------

export async function eip2612Permit({
                                        token,
                                        chain,
                                        ownerAddress,
                                        spenderAddress,
                                        value,
                                    }: Eip2612PermitArgs): Promise<TypedDataDefinition> {
    return {
        types: {
            EIP712Domain: [
                { name: "name", type: "string" },
                { name: "version", type: "string" },
                { name: "chainId", type: "uint256" },
                { name: "verifyingContract", type: "address" },
            ],
            Permit: [
                { name: "owner", type: "address" },
                { name: "spender", type: "address" },
                { name: "value", type: "uint256" },
                { name: "nonce", type: "uint256" },
                { name: "deadline", type: "uint256" },
            ],
        },
        primaryType: "Permit",
        domain: {
            name: await token.read.name(),
            version: await token.read.version(),
            chainId: chain.id,
            verifyingContract: token.address,
        },
        message: {
            owner: ownerAddress,
            spender: spenderAddress,
            value: value.toString(),
            nonce: (await token.read.nonces([ownerAddress])).toString(),
            deadline: maxUint256.toString(),
        },
    };
}

// -----------------------------------------------
// ABI
// -----------------------------------------------

export const eip2612Abi = [
    ...erc20Abi,
    {
        inputs: [{ internalType: "address", name: "owner", type: "address" }],
        stateMutability: "view",
        type: "function",
        name: "nonces",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    },
    {
        inputs: [],
        name: "version",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
    },
] as const;

// -----------------------------------------------
// SIGN PERMIT
// -----------------------------------------------

export async function signPermit({
                                     tokenAddress,
                                     client,
                                     account,
                                     spenderAddress,
                                     permitAmount,
                                 }: SignPermitArgs): Promise<Hex> {

    const token = getContract({
        client,
        address: tokenAddress,
        abi: eip2612Abi,
    });

    const permitData = await eip2612Permit({
        token,
        chain: { id: client.chain!.id },
        ownerAddress: account.address,
        spenderAddress,
        value: permitAmount,
    });

    const wrappedPermitSignature = await account.signTypedData(permitData);

    const isValid = await client.verifyTypedData({
        ...permitData,
        address: account.address,
        signature: wrappedPermitSignature,
    });

    if (!isValid) {
        throw new Error(
            `Invalid permit signature for ${account.address}: ${wrappedPermitSignature}`,
        );
    }

    const { signature } = parseErc6492Signature(wrappedPermitSignature);

    return signature;
}
