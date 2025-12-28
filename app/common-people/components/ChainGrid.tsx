
import { Grid } from "@mui/material";
import { ChainCard, ChainData } from "./ChainCard";

interface ChainGridProps {
    chains: ChainData[];
    onSelectChain: (chain: ChainData) => void;
    hideBalance?: boolean;
}

export function ChainGrid({ chains, onSelectChain, hideBalance }: ChainGridProps) {
    return (
        <Grid container spacing={2}>
            {chains.map((chain) => (
                <Grid key={chain.id} size={{ xs: 6, sm: 4 }}>
                    <ChainCard
                        chain={chain}
                        onClick={() => onSelectChain(chain)}
                        hideBalance={hideBalance}
                    />
                </Grid>
            ))}
        </Grid>
    );
}
