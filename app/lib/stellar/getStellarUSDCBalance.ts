import {STELLAR} from "@/app/constants/chais";
import { Horizon } from "stellar-sdk";

export const getStellarUSDCBalance = async (
    stellarAddress: string
): Promise<number> => {
    const server = new Horizon.Server(STELLAR.serverURL);

    const account = await server.loadAccount(stellarAddress);

    const balance = account.balances.find(
        (b: any) =>
            b.asset_type === "credit_alphanum4" &&
            b.asset_code === STELLAR.code &&
            b.asset_issuer === STELLAR.usdc
    );

    return balance ? Number(balance.balance) : 0;
};
