import React, { useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    IconButton,
    Typography,
    Box,
    CircularProgress,
    Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Connector, useConnect, useAccount, useDisconnect } from 'wagmi';

interface WalletSelectionModalProps {
    open: boolean;
    onClose: () => void;
    onConnected?: (address: string, connector: Connector) => void;
}

export const WalletSelectionModal = ({ open, onClose, onConnected }: WalletSelectionModalProps) => {
    const { connectors, connect, isPending, error } = useConnect();
    const { address, isConnected, connector: activeConnector } = useAccount();
    const { disconnect } = useDisconnect();

    // Notify parent when connected
    useEffect(() => {
        if (open && isConnected && address && activeConnector && onConnected) {
            onConnected(address, activeConnector);
        }
    }, [open, isConnected, address, activeConnector, onConnected]);

    const handleConnect = (connector: Connector) => {
        // If already connected to this connector, just close
        if (activeConnector?.uid === connector.uid) {
            onClose();
            return;
        }

        // Disconnect current if any, then connect new
        if (isConnected) {
            disconnect();
        }

        connect({ connector });
    };

    const handleDisconnect = () => {
        disconnect();
    };

    const getIcon = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('metamask')) return 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg';
        if (lowerName.includes('walletconnect')) return 'https://raw.githubusercontent.com/WalletConnect/walletconnect-assets/master/Logo/Blue%20(Default)/Logo.svg';
        if (lowerName.includes('coinbase')) return 'https://avatars.githubusercontent.com/u/18060234?s=200&v=4';
        if (lowerName.includes('injected')) return 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg';
        return 'https://avatars.githubusercontent.com/u/103632906?s=200&v=4';
    };

    const getDisplayName = (name: string) => {
        if (name === 'Injected') return 'MetaMask / Browser Wallet';
        return name;
    };

    return (
        <Dialog
            onClose={onClose}
            open={open}
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    width: '100%',
                    maxWidth: 420,
                    border: '2px solid #000',
                }
            }}
        >
            <DialogTitle sx={{
                m: 0,
                p: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid #000'
            }}>
                <Typography component="span" variant="h6" fontWeight="bold">
                    Conectar Wallet Externa
                </Typography>
                <IconButton onClick={onClose} sx={{ border: '2px solid #000', borderRadius: 2 }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            {/* Connected Status Banner */}
            {isConnected && address && (
                <Box sx={{
                    p: 2,
                    bgcolor: '#e8f5e9',
                    borderBottom: '2px solid #000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircleIcon sx={{ color: '#4caf50' }} />
                        <Box>
                            <Typography variant="body2" fontWeight={600}>
                                Conectado
                            </Typography>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                                {address.slice(0, 6)}...{address.slice(-4)}
                            </Typography>
                        </Box>
                    </Box>
                    <Chip
                        label="Desconectar"
                        onClick={handleDisconnect}
                        sx={{
                            bgcolor: '#fff',
                            border: '2px solid #f44336',
                            fontWeight: 600,
                            '&:hover': { bgcolor: '#ffebee' }
                        }}
                    />
                </Box>
            )}

            {/* Error Banner */}
            {error && (
                <Box sx={{ p: 2, bgcolor: '#ffebee', borderBottom: '2px solid #000' }}>
                    <Typography variant="body2" color="error">
                        Error: {error.message}
                    </Typography>
                </Box>
            )}

            <List sx={{ pt: 0 }}>
                {connectors.map((connector) => {
                    const isActive = activeConnector?.uid === connector.uid;

                    return (
                        <ListItem
                            component="button"
                            key={connector.uid}
                            onClick={() => handleConnect(connector)}
                            disabled={isPending}
                            sx={{
                                borderBottom: '1px solid #eee',
                                '&:hover': { bgcolor: isActive ? '#e8f5e9' : '#f5f5f5', cursor: 'pointer' },
                                bgcolor: isActive ? '#e8f5e9' : 'transparent',
                                border: 'none',
                                width: '100%',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                py: 2,
                                px: 3,
                                '&:disabled': {
                                    opacity: 0.7
                                }
                            }}
                        >
                            <ListItemAvatar>
                                <Avatar
                                    src={getIcon(connector.name)}
                                    sx={{ bgcolor: 'transparent', width: 40, height: 40 }}
                                    variant="square"
                                    imgProps={{ style: { objectFit: 'contain' } }}
                                />
                            </ListItemAvatar>
                            <ListItemText
                                primary={getDisplayName(connector.name)}
                                primaryTypographyProps={{ fontWeight: 600 }}
                                secondary={isActive ? 'Conectado' : undefined}
                                secondaryTypographyProps={{ color: '#4caf50', fontWeight: 600 }}
                            />
                            {isPending && !isActive && (
                                <CircularProgress size={24} />
                            )}
                            {isActive && (
                                <CheckCircleIcon sx={{ color: '#4caf50' }} />
                            )}
                        </ListItem>
                    );
                })}
            </List>

            <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderTop: '2px solid #000' }}>
                <Typography variant="caption" color="text.secondary">
                    Al conectar una wallet externa, esta tendrá prioridad sobre la wallet local para transferencias.
                </Typography>
            </Box>
        </Dialog>
    );
};
