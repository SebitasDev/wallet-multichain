import { BridgeStrategy, BridgeContext } from "./types";
import { GaslessStrategy } from "./gasless";
import { CCTPStrategy } from "./cctp";
import { NearStrategy } from "./near";
import { SmartAccountStrategy } from "./smartAccount";
import { SettleResponse } from "@/app/facilitator/types";
import { StandardBridgeStrategy } from "./standard";

export class BridgeManager {
    private strategies: BridgeStrategy[];

    constructor() {
        this.strategies = [
            new StandardBridgeStrategy(),
            new SmartAccountStrategy(),
            new GaslessStrategy(),
            new CCTPStrategy(),
            new NearStrategy()
        ];
    }

    private getStrategy(context: BridgeContext): BridgeStrategy | undefined {
        return this.strategies.find(strategy => strategy.canHandle(context));
    }

    async execute(context: BridgeContext): Promise<SettleResponse> {
        const strategy = this.getStrategy(context);

        if (!strategy) {
            return {
                success: false,
                errorReason: "No suitable routing path found for these chains"
            };
        }

        console.log(`[BridgeManager] Routing to: ${strategy.name}`);
        return strategy.execute(context);
    }
}
