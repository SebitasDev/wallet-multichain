export type ChainInfo = {
  name: string;
  tag: string;
  color: string;
  tokens: number;
  value: number;
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
    chains: Array<{ chainId: string; amount: number }>;
  }>;
  totalFees: number;
  commission: number;
};
