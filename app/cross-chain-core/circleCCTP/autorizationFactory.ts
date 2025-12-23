export const createAuthorization = async (owner: any, client: any, account: any) => {
    const nonceNumber = await client.getTransactionCount({
        address: owner.address,
    });

    console.log("nonce number", nonceNumber);

    const auth = await owner.signAuthorization({
        address: owner.address,
        chainId: BigInt(client.chain.id),
        nonce: BigInt(nonceNumber),
        contractAddress: account.authorization.address,
    });

    return auth;
};
