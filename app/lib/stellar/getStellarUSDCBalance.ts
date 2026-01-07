import { NETWORKS } from "@/app/constants/chainsInformation";
import { Horizon } from "stellar-sdk";
import { toast } from "react-toastify";

export const getStellarUSDCBalance = async (
    stellarAddress: string
): Promise<number | null> => {
    const serverUrl = NETWORKS["Stellar"]?.nonEvm?.rpcUrl;
    if (!serverUrl) {
        toast.error("Server URL is missing");
        throw new Error("Stellar server URL not configured");
    }

    const server = new Horizon.Server(serverUrl);

    try {
        const account = await server.loadAccount(stellarAddress);
        const usdcAddress = NETWORKS["Stellar"]?.assets?.find(a => a.name === "USDC")?.address;

        if (!usdcAddress) return null;

        const balance = account.balances.find(
            (b: any) =>
                b.asset_type === "credit_alphanum4" &&
                b.asset_code === "USDC" &&
                b.asset_issuer === usdcAddress
        );

        return balance ? Number(balance.balance) : 0;
    } catch (e: any) {
        if (e.response && e.response.status === 404) {
            toast.error("Cuenta inactiva. Envía al menos 1 XLM para activarla.");
            return 0;
        }

        console.error("Error fetching Stellar balance:", e);
        return null;
    }
};
