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
