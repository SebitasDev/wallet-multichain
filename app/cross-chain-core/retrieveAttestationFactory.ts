import axios from "axios";

export const createRetrieveAttestation = async (transactionHash: string, chainId: string, timeout = 60000) => {
    const url = `${process.env.NEXT_PUBLIC_ENVIROMENT === "development" ? "https://iris-api-sandbox.circle.com" : "https://iris-api.circle.com"}/v2/messages/${chainId}?transactionHash=${transactionHash}`;
    const start = Date.now();

    while (true) {
        if (Date.now() - start > timeout) {
            throw new Error("Timeout: Attestation not retrieved within the expected time.");
        }

        try {
            const response = await axios.get(url);

            const message = response.data?.messages?.[0];
            if (message?.status === "complete") {
                console.log("Attestation retrieved successfully!");
                return message;
            }

            console.log("Waiting for attestation...");
        } catch (error: any) {
            if (error.response?.status === 404) {
                console.log("Waiting for attestation...");
            } else {
                console.error("Error fetching attestation:", error.message);
            }
        }

        await new Promise((resolve) => setTimeout(resolve, 5000));
    }
};
