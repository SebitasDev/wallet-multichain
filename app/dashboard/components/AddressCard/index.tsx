import { Card, Box } from "@mui/material";
import { Address } from "abitype";

import { useAddressCard } from "@/app/dashboard/hooks/useAddressCard";
import { AddressCardHeader } from "./AddressCardHeader";
import { AddressCardInfo } from "./AddressCardInfo";
import { AddressChainList } from "./AddressChainList";

interface IAddressCardProps {
    address: Address;
    walletName: string;
}

export const AddressCard = ({ address, walletName }: IAddressCardProps) => {
    const {
        // State
        showMore,
        showNameExpanded,

        // Data
        totalBalance,
        truncated,
        displayName,
        exceedsNameLimit,

        // Actions
        toggleShowMore,
        toggleNameExpanded,
        handleRemoveWallet,
        copyToClipboard
    } = useAddressCard({ address, walletName });

    return (
        <Card
            className="tour-address-card"
            elevation={0}
            sx={{
                borderRadius: 4,
                overflow: "hidden",
                background: "#ffffff",
                border: "3px solid #000000",
                boxShadow: "6px 6px 0px #000000",
                transition: "all 0.2s",
                "&:hover": {
                    transform: "translate(2px, 2px)",
                    boxShadow: "4px 4px 0px #000000",
                },
            }}
        >


            <Box sx={{
                p: { xs: 2, sm: 3 }, // Original padding moved here
                background: "#f5f5f5",
                borderBottom: "3px solid #000000",
                color: "#000000"
            }}>
                <AddressCardHeader
                    displayName={displayName}
                    showNameExpanded={showNameExpanded}
                    exceedsNameLimit={exceedsNameLimit}
                    toggleNameExpanded={toggleNameExpanded}
                    handleRemoveWallet={handleRemoveWallet}
                />

                <AddressCardInfo
                    address={address}
                    truncated={truncated}
                    totalBalance={totalBalance}
                    copyToClipboard={copyToClipboard}
                />
            </Box>


            {/* Chain List Section */}
            <AddressChainList
                address={address}
                showMore={showMore}
                toggleShowMore={toggleShowMore}
            />
        </Card>
    );
};
