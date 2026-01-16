import { Menu, MenuItem, ListItemIcon, ListItemText, Divider, Box } from "@mui/material";
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

interface WalletConnectionMenuProps {
    anchorEl: HTMLElement | null;
    open: boolean;
    onClose: () => void;
    hasPassword: boolean;
    connectors: readonly any[];
    onSelect: (type: 'local' | 'external' | 'embedded', connector?: any) => void;
    hideMetaMask?: boolean;
}

export const WalletConnectionMenu = ({
    anchorEl,
    open,
    onClose,
    hasPassword,
    connectors,
    onSelect,
    hideMetaMask
}: WalletConnectionMenuProps) => {
    return (
        <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={onClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
        >
            {hasPassword && (
                <div>
                    <MenuItem onClick={() => onSelect('local')}>
                        <ListItemIcon>
                            <AccountBalanceWalletIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Local Wallet</ListItemText>
                    </MenuItem>
                    <Divider />
                </div>
            )}

            {!hideMetaMask && connectors.filter(c => c.name === 'MetaMask').map((connector) => (
                <MenuItem key={connector.uid || connector.id} onClick={() => onSelect('external', connector)}>
                    <ListItemIcon>
                        <Box
                            component="img"
                            src={connector.icon || "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"}
                            sx={{ width: 20, height: 20, objectFit: 'contain' }}
                            onError={(e: any) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        {(!connector.icon) && <AccountBalanceWalletIcon fontSize="small" />}
                    </ListItemIcon>
                    <ListItemText>{connector.name}</ListItemText>
                </MenuItem>
            ))}

            {hideMetaMask && (
                <MenuItem onClick={() => onSelect('embedded')}>
                    <ListItemIcon>
                        <AccountBalanceWalletIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText>Embedded Wallet</ListItemText>
                </MenuItem>
            )}

            {!hideMetaMask && connectors.length === 0 && (
                <MenuItem disabled>No external wallets found</MenuItem>
            )}
        </Menu>
    );
};
