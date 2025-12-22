import {
    Horizon,
    Keypair,
    Asset,
    Operation,
    TransactionBuilder,
    BASE_FEE,
} from "stellar-sdk";
import { STELLAR } from "@/app/constants/chais";

export const createUSDCTrustline = async ({
    stellarAddress,
    secret,
}: {
    stellarAddress: string;
    secret: string;
}) => {
    const serverUrl = STELLAR.nonEvm?.serverURL;
    const passphrase = STELLAR.nonEvm?.networkPassphrase;
    const usdcAddress = STELLAR.assets.find(a => a.name === "USDC")?.address;

    if (!serverUrl || !passphrase || !usdcAddress) {
        throw new Error("Stellar configuration missing");
    }

    const server = new Horizon.Server(serverUrl);

    const keypair = Keypair.fromSecret(secret);

    const account = await server.loadAccount(stellarAddress);

    const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: passphrase,
    })
        .addOperation(
            Operation.changeTrust({
                asset: new Asset("USDC", usdcAddress),
            })
        )
        .setTimeout(30)
        .build();

    tx.sign(keypair);

    console.log("token agregado", tx);

    try {
        await server.submitTransaction(tx);
    } catch (error: any) {
        // Extract useful Stellar error codes
        const resultCodes = error.response?.data?.extras?.result_codes;
        if (resultCodes) {
            console.error("Stellar Trustline Detail Error:", JSON.stringify(resultCodes, null, 2));
            // Throw a more descriptive error that the UI can show
            throw new Error(`Stellar Error: ${JSON.stringify(resultCodes)}`);
        }
        throw error;
    }
};
