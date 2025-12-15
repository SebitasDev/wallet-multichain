import {
    Horizon,
    Keypair,
    Asset,
    Operation,
    TransactionBuilder,
    BASE_FEE,
} from "stellar-sdk";
import {STELLAR} from "@/app/constants/chais";

export const createUSDCTrustline = async ({
                                              stellarAddress,
                                              secret,
                                          }: {
    stellarAddress: string;
    secret: string;
}) => {
    const server = new Horizon.Server(STELLAR.serverURL);

    const keypair = Keypair.fromSecret(secret);

    const account = await server.loadAccount(stellarAddress);

    const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: STELLAR.networkPassphrase,
    })
        .addOperation(
            Operation.changeTrust({
                asset: new Asset(STELLAR.code, STELLAR.usdc),
            })
        )
        .setTimeout(30)
        .build();

    tx.sign(keypair);

    console.log("token agregado",tx)

    await server.submitTransaction(tx);
};
