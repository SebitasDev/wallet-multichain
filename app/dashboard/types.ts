export type ChainInfo = {
  name: string;
  tag: string;
  color: string;
  tokens: Record<string, number> | number;
  value: number;
  // [NEW] Added for compatibility with EOA/modal logic
  chainId?: string;
  amount?: number;
};

export type Wallet = {
  name: string;
  address: string;
  chains: ChainInfo[];
  total: number;
  defaultExpanded?: boolean;
};

export type AllocationSummary = {
  targetAmount: number;
  totalAmountTaken: number;
  remainingToCover: number;
  allocations: Array<{
    from: string;
    chains: Array<{ chainId: string; amount: number; token?: string; id?: string; price?: number }>;
  }>;
  totalFees: number;
  commission: number;
};
