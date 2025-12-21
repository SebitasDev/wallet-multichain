import { Horizon, rpc, TransactionBuilder, xdr, Asset, Operation } from "stellar-sdk";
import {
    PoolContractV2,
    PoolV2,
    PoolUser,
    RequestType
} from "@blend-capital/blend-sdk";
import { BLEND_CONFIG } from "../config/blendConfig";

export interface BlendData {
    balance: number;
    invested: number;
    apy: number;
    timestamp: number;
    hasTrustline: boolean;
}

export class BlendService {
    private sorobanServer: rpc.Server;
    private horizonServer: Horizon.Server;

    constructor() {
        this.sorobanServer = new rpc.Server(BLEND_CONFIG.SOROBAN_RPC, { allowHttp: true });
        this.horizonServer = new Horizon.Server(BLEND_CONFIG.STELLAR_RPC);
    }

    async getBlendData(stellarAddress: string, assetId: string, assetIssuer: string, assetCode: string): Promise<BlendData> {
        // 1. Fetch Pool Data
        const network = {
            rpc: BLEND_CONFIG.SOROBAN_RPC,
            passphrase: BLEND_CONFIG.NETWORK_PASSPHRASE,
            opts: { allowHttp: true }
        };

        const pool = await PoolV2.load(network, BLEND_CONFIG.POOL_ID);
        const reserve = pool.reserves.get(assetId);

        let supplyApy = 0;
        if (reserve) {
            // Use estimated APY directly from reserve data
            supplyApy = reserve.estSupplyApy * 100;
        }

        // 2. Fetch User Position
        let investedFormatted = 0;
        if (reserve) {
            try {
                const user = await PoolUser.load(network, BLEND_CONFIG.POOL_ID, pool, stellarAddress);
                const supply = user.getSupply(reserve);
                const collateral = user.getCollateral(reserve);
                // Deposit via SupplyCollateral puts funds in collateral position
                const totalRaw = supply + collateral;
                investedFormatted = Number(totalRaw) / 10_000_000;
            } catch (err) {
                // User might not have a position yet
                console.warn("User has no position or error loading user:", err);
            }
        }

        // 3. Wallet Balance (USDC) from Horizon
        const account = await this.horizonServer.loadAccount(stellarAddress);
        const usdcBalanceLine = account.balances.find((b: any) =>
            b.asset_code === assetCode && b.asset_issuer === assetIssuer
        );
        const balance = usdcBalanceLine ? Number(usdcBalanceLine.balance) : 0;

        return {
            balance,
            invested: investedFormatted,
            apy: Number(supplyApy.toFixed(2)),
            timestamp: pool.timestamp,
            hasTrustline: !!usdcBalanceLine
        };
    }

    async submitTransaction(signer: any, amount: number, type: "deposit" | "withdraw", assetId: string): Promise<any> {
        const poolContract = new PoolContractV2(BLEND_CONFIG.POOL_ID);

        const request = {
            amount: BigInt(Math.floor(amount * 10_000_000)),
            request_type: type === "deposit" ? RequestType.SupplyCollateral : RequestType.WithdrawCollateral,
            address: assetId,
        };

        // Get operation XDR from SDK
        // @ts-ignore
        const opXdr = poolContract.submit({
            from: signer.publicKey(),
            spender: signer.publicKey(),
            to: signer.publicKey(),
            requests: [request]
        });

        // 1. Fetch current account state (sequence number)
        const account = await this.horizonServer.loadAccount(signer.publicKey());

        // 2. Build Transaction with HIGHER BASE FEE
        const tx = new TransactionBuilder(account, {
            fee: "100000", // 0.01 XLM - Higher buffer to avoid txInsufficientFee
            networkPassphrase: BLEND_CONFIG.NETWORK_PASSPHRASE,
        })
            .addOperation(xdr.Operation.fromXDR(opXdr, "base64"))
            .setTimeout(30)
            .build();

        // 3. Prepare (Simulate)
        let preparedTx;
        try {
            preparedTx = await this.sorobanServer.prepareTransaction(tx);
        } catch (e: any) {
            console.error("Simulation failed:", e);
            if (e.message?.includes("Error(Contract, #10)") || e.message?.includes("resulting balance is not within the allowed range")) {
                throw new Error("Fondos insuficientes. Verifica que tienes USDC y XLM para el gas.");
            }
            throw e;
        }

        // 4. Sign
        preparedTx.sign(signer);

        // 5. Send
        const response = await this.sorobanServer.sendTransaction(preparedTx);

        if (response.status !== "PENDING") {
            // Soroban RPC can return ERROR synchronously for simulation failures
            if (response.status === "ERROR") {
                // @ts-ignore
                const errDetail = response.error?.message || JSON.stringify(response.error);
                console.error("Transaction rejected by RPC:", errDetail);

                // Check for specific error codes in the response if available
                if (JSON.stringify(response).includes("Error(Contract, #10)")) {
                    throw new Error("Fondos insuficientes. Verifica que tienes USDC y XLM para el gas.");
                }
            }
            throw new Error(`La transacción falló. Estado: ${response.status}`);
        }

        // 6. Poll for results
        return this.pollTransaction(response.hash);
    }

    private async pollTransaction(hash: string): Promise<any> {
        // Wait loop
        let status: string = "PENDING";
        let result = null;

        console.log(`Starting polling for hash: ${hash}`);

        for (let i = 0; i < 60; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000));

            try {
                // Manual fetch to avoid SDK "Bad union switch: 4" error
                const rpcRes = await fetch(BLEND_CONFIG.SOROBAN_RPC, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        jsonrpc: "2.0",
                        id: "poll-tx",
                        method: "getTransaction",
                        params: { hash: hash }
                    })
                });
                const rpcJson = await rpcRes.json();

                if (rpcJson.error) {
                    // This often happens if the tx is not yet found by the node immediately
                    console.log(`Polling attempt ${i + 1}: RPC Error (might be not found yet):`, rpcJson.error);
                    continue;
                }

                if (rpcJson.result) {
                    const txData = rpcJson.result;
                    status = txData.status;
                    console.log(`Polling attempt ${i + 1} Status: ${status}`);

                    if (status === "SUCCESS") {
                        result = txData;
                        break;
                    } else if (status === "FAILED") {
                        console.error("Transaction Failed Data:", txData);
                        throw new Error("Transaction Failed on-chain");
                    }
                } else {
                    console.log(`Polling attempt ${i + 1}: Result is null/undefined in RPC response`, rpcJson);
                }
            } catch (pollErr) {
                console.warn(`Polling retry error attempt ${i + 1}...`, pollErr);
            }
        }

        if (status !== "SUCCESS") {
            throw new Error("Transaction timed out");
        }

        return result;
    }

    async createTrustline(signer: any, assetId: string, assetIssuer: string, assetCode: string): Promise<any> {
        console.log(`Creating trustline for ${assetCode}...`);

        try {
            const account = await this.horizonServer.loadAccount(signer.publicKey());
            const asset = new Asset(assetCode, assetIssuer);

            const tx = new TransactionBuilder(account, {
                fee: "100000",
                networkPassphrase: BLEND_CONFIG.NETWORK_PASSPHRASE,
            })
                .addOperation(Operation.changeTrust({
                    asset: asset,
                }))
                .setTimeout(30)
                .build();

            // Sign
            tx.sign(signer);

            // Send via Horizon (standard for classic ops)
            console.log("Submitting trustline tx to Horizon...");
            const result = await this.horizonServer.submitTransaction(tx);
            console.log("Trustline created successfully:", result);
            return result;
        } catch (e: any) {
            console.error("Trustline creation failed:", e);
            if (e.response?.data?.extras?.result_codes) {
                const codes = e.response.data.extras.result_codes;
                console.error("Horizon Error Codes:", codes);
                const opCode = codes.operations?.[0] || codes.transaction;

                if (opCode === "op_low_reserve") {
                    throw new Error("No tienes suficiente XLM (Reserva mínima). Deposita más XLM para activar este activo.");
                }

                throw new Error(`Error Stellar: ${opCode}`);
            }
            throw new Error(e.message || "Falló la creación del Trustline");
        }
    }
}

export const blendService = new BlendService();
