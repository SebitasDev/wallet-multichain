import { CopyableAddress } from "@/app/components/molecules/CopyableAddress";
import { Wallet } from "@/app/dashboard/types";

interface WalletCardAddressBarProps {
    wallet: Wallet;
    onCopy: (value: string, label: string) => void;
}

export const WalletCardAddressBar = ({ wallet, onCopy }: WalletCardAddressBarProps) => {
    return (
        <CopyableAddress
            address={wallet.address}
            onCopy={onCopy}
            variant="glass"
        />
    );
};
