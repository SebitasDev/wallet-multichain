import {
    Horizon,
    Keypair,
    Asset,
    Operation,
    TransactionBuilder,
    BASE_FEE,
} from "stellar-sdk";
import { NETWORKS } from "@/app/constants/chainsInformation";
import { toast } from "react-toastify";

export const createUSDCTrustline = async ({
    stellarAddress,
    secret,
}: {
    stellarAddress: string;
    secret: string;
}) => {
    const serverUrl = NETWORKS["Stellar"]?.nonEvm?.rpcUrl;
    const passphrase = NETWORKS["Stellar"]?.nonEvm?.networkPassphrase;
    const usdcAddress = NETWORKS["Stellar"]?.assets?.find(a => a.name === "USDC")?.address;

    if (!serverUrl || !passphrase || !usdcAddress) {
        toast.error("Stellar Stellar configuration missing")
        return;
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

    try {
        await server.submitTransaction(tx);
        toast.success("Token has been added successfully.");
    } catch (error: any) {
        const resultCodes = error.response?.data?.extras?.result_codes;
        if (resultCodes) {
            toast.error(`Stellar Error: ${JSON.stringify(resultCodes)}`)
            return;
        }
    }
};
