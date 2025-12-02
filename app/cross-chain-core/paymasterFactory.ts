import { encodePacked, Address, Hex } from "viem";
import {signPermit} from "@/app/utils/permit";
import {toUSDCBigInt} from "@/app/utils/toUSDCBigInt";

export const createPaymaster = {
    async getPaymasterData(
        usdcAddress: Address,
        account: any,
        client: any
    ): Promise<{
        paymaster: Address;
        paymasterData: Hex;
        paymasterVerificationGasLimit: bigint;
        paymasterPostOpGasLimit: bigint;
        isFinal: boolean;
    }> {

        const permitAmount = toUSDCBigInt(10);

        const permitSignature = await signPermit({
            tokenAddress: usdcAddress,
            account,
            client,
            spenderAddress: "0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966",
            permitAmount
        });

        const paymasterData = encodePacked(
            ["uint8", "address", "uint256", "bytes"],
            [0, usdcAddress, permitAmount, permitSignature]
        );

        return {
            paymaster: "0x3BA9A96eE3eFf3A69E2B18886AcF52027EFF8966",
            paymasterData,
            paymasterVerificationGasLimit: BigInt(200_000),
            paymasterPostOpGasLimit: BigInt(15_000),
            isFinal: true
        };
    }
};
