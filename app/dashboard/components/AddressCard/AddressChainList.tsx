import {
    CardContent,
    List,
    Divider,
    CardActions,
    Button,
} from "@mui/material";
import ChainItem from "@/app/components/molecules/ChainItem";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Address } from "abitype";

interface AddressChainListProps {
    address: Address;
    showMore: boolean;
    toggleShowMore: () => void;
}

export const AddressChainList = ({
    address,
    showMore,
    toggleShowMore
}: AddressChainListProps) => {
    return (
        <>
            <CardContent
                sx={{
                    p: 0,
                    background: "#ffffff",
                    "& .MuiDivider-root": {
                        borderColor: "#000000",
                        borderWidth: "1px",
                    },
                }}
            >
                <List disablePadding sx={{ backgroundColor: "transparent" }}>
                    {/* Chains visibles por defecto */}
                    <Divider />
                    <ChainItem address={address} chainKey="Base" />
                    <Divider />
                    <ChainItem address={address} chainKey="Optimism" />

                    {/* Chains adicionales */}
                    {showMore && (
                        <>
                            <Divider />
                            <ChainItem address={address} chainKey="Arbitrum" />
                            <Divider />
                            <ChainItem address={address} chainKey="Unichain" />
                            <Divider />
                            <ChainItem address={address} chainKey="Polygon" />
                            <Divider />
                            <ChainItem address={address} chainKey="Avalanche" />
                            <Divider />
                            <ChainItem address={address} chainKey="WorldChain" />
                        </>
                    )}
                </List>
            </CardContent>

            {/* FOOTER / SHOW MORE BUTTON */}
            <Divider sx={{ borderColor: "#000000", borderWidth: "3px" }} />
            <CardActions
                sx={{
                    p: { xs: 1.5, sm: 2 },
                    background: "#f5f5f5",
                }}
            >
                <Button
                    fullWidth
                    variant="text"
                    startIcon={
                        <ExpandMoreIcon
                            sx={{
                                transform: showMore ? "rotate(180deg)" : "rotate(0deg)",
                                transition: "transform 0.3s",
                                color: "#000000",
                            }}
                        />
                    }
                    sx={{
                        textTransform: "none",
                        color: "#000000",
                        fontWeight: 800,
                        fontSize: { xs: 13, sm: 14 },
                        py: { xs: 1, sm: 1.2 },
                        borderRadius: 3,
                        border: "2px solid #000000",
                        background: "#ffffff",
                        transition: "all 0.2s",
                        "&:hover": {
                            background: "#f5f5f5",
                            transform: "scale(1.01)",
                        },
                    }}
                    onClick={toggleShowMore}
                >
                    {showMore ? "Ocultar chains" : "Ver 4 chains más"}
                </Button>
            </CardActions>
        </>
    );
};
