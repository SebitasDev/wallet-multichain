// Placeholder bridge utilities to avoid build failures when Circle Bridge Kit is absent.
// Replace with real implementation once @circle-fin/bridge-kit is available in the environment.

import { Address } from "abitype";

type ChainKey = "Optimism_Sepolia" | "Polygon_Amoy_Testnet" | "Base_Sepolia";

export const bridgeUSDC = async (
  _privateKey: string,
  _fromChain: ChainKey,
  _toChain: ChainKey,
  _recipient: Address,
  _amount: string
) => {
  throw new Error("Bridge functionality is not available in this build (missing Circle Bridge Kit).");
};
