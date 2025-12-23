import { PrivateKeyAccount } from "viem";
import {Simple7702SmartAccountImplementation, SmartAccount, toSimple7702SmartAccount} from "viem/account-abstraction";
import {privateKeyToAccount} from "viem/accounts";
export interface CreatedClient {
    owner: PrivateKeyAccount;
    account: SmartAccount;
}

export async function createAccount(
    publicClient: Simple7702SmartAccountImplementation['client'],
    privateKey: `0x${string}`
): Promise<CreatedClient> {

    const owner = privateKeyToAccount(privateKey);

    const account = await toSimple7702SmartAccount({
        client: publicClient,
        owner
    });

    return {
        owner,
        account
    };
}
