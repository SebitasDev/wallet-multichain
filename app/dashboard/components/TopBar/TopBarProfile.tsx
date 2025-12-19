import { Avatar, Box, Stack, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from "@mui/material";
import { useState } from "react";
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useXOContracts } from "../../hooks/useXOConnect";
import { PasswordModal } from "../PasswordModal"; // Import PasswordModal
import { useWalletPasswordStore } from "@/app/store/useWalletPasswordStore";
import { toast } from "react-toastify";

export const TopBarProfile = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false); // Modal State
    const open = Boolean(anchorEl);
    const { factoryReset } = useXOContracts();

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleResetClick = () => {
        handleClose();
        setPasswordModalOpen(true); // Open modal instead of confirm
    };

    const handleResetConfirm = async () => {
        // Factory Reset: Wipes all data
        setPasswordModalOpen(false);
        factoryReset();
    };

    return (
        <>
            <Stack direction="row" spacing={2} alignItems="center">
                {/* Avatar with Menu Trigger */}
                <Box>
                    <Avatar
                        id="tour-profile"
                        onClick={handleClick}
                        src="https://i.postimg.cc/0jx6tjVZ/photo-5033044889268063043-y.jpg"
                        sx={{
                            width: 54,
                            height: 54,
                            border: "2px solid #000000",
                            cursor: "pointer",
                            transition: "transform 0.2s",
                            "&:hover": {
                                transform: "scale(1.05)"
                            }
                        }}
                    />
                    <Menu
                        anchorEl={anchorEl}
                        id="account-menu"
                        open={open}
                        onClose={handleClose}
                        onClick={handleClose}
                        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
                        PaperProps={{
                            elevation: 0,
                            sx: {
                                overflow: 'visible',
                                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                                mt: 1.5,
                                border: "2px solid #000",
                                borderRadius: 2,
                                "& .MuiAvatar-root": {
                                    width: 32,
                                    height: 32,
                                    ml: -0.5,
                                    mr: 1,
                                },
                            },
                        }}
                    >
                        <MenuItem onClick={handleClose}>
                            <ListItemIcon>
                                <PersonIcon fontSize="small" sx={{ color: "black" }} />
                            </ListItemIcon>
                            <ListItemText primary="Perfil" primaryTypographyProps={{ fontWeight: 700 }} />
                        </MenuItem>
                        <MenuItem onClick={handleClose}>
                            <ListItemIcon>
                                <StarIcon fontSize="small" sx={{ color: "#FFD700" }} />
                            </ListItemIcon>
                            <ListItemText primary="Puntos" primaryTypographyProps={{ fontWeight: 700 }} />
                        </MenuItem>
                        <Divider sx={{ borderBottom: "2px solid #eee" }} />
                        <MenuItem onClick={handleResetClick} sx={{ color: "#FF4444" }}>
                            <ListItemIcon>
                                <RestartAltIcon fontSize="small" sx={{ color: "#FF4444" }} />
                            </ListItemIcon>
                            <ListItemText primary="Resetear Cuenta" primaryTypographyProps={{ fontWeight: 900 }} />
                        </MenuItem>
                    </Menu>
                </Box>

                {/* Badges Container */}
                <Box sx={{ overflow: "hidden", maxWidth: { xs: "240px", sm: "none" } }}>
                    <style>
                        {`
                        @keyframes scroll {
                            0% { transform: translateX(0); }
                            100% { transform: translateX(-50%); }
                        }
                        `}
                    </style>

                    {/* MOBILE CAROUSEL (Visible only on xs) */}
                    <Box
                        sx={{
                            display: { xs: "flex", sm: "none" },
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            width: "100%",
                            maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
                            WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
                        }}
                    >
                        <Box
                            sx={{
                                display: "flex",
                                animation: "scroll 15s linear infinite",
                                gap: 1,
                                pr: 1,
                            }}
                        >
                            {/* Duplicate items for seamless loop */}
                            {[...Array(4)].map((_, i) => (
                                <Box key={i} sx={{ display: "flex", gap: 1 }}>
                                    {[
                                        { text: "6 chains", bgColor: "#f5f5f5" },
                                        { text: "$0.01 Fee", bgColor: "#f5f5f5" },
                                        { text: "15% APY", bgColor: "#f5f5f5" },
                                    ].map((chip, idx) => (
                                        <Box
                                            key={`${i}-${idx}`}
                                            sx={{
                                                background: chip.bgColor,
                                                color: "#000000",
                                                borderRadius: "999px",
                                                fontSize: 12,
                                                px: 1.6,
                                                py: 0.6,
                                                fontWeight: 600,
                                                border: "2px solid #000000",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {chip.text}
                                        </Box>
                                    ))}
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* DESKTOP STATIC (Visible on sm+) */}
                    <Stack
                        spacing={1}
                        sx={{ display: { xs: "none", sm: "flex" } }}
                    >
                        <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                            justifyContent={{ xs: "flex-start", sm: "flex-start" }}
                        >
                            {[
                                { text: "6 chains", bgColor: "#f5f5f5" },
                                { text: "$0.01 Fee", bgColor: "#f5f5f5" },
                                { text: "15% APY", bgColor: "#f5f5f5" },
                            ].map((chip) => (
                                <Box
                                    key={chip.text}
                                    sx={{
                                        background: chip.bgColor,
                                        color: "#000000",
                                        borderRadius: "999px",
                                        fontSize: 12,
                                        px: 1.6,
                                        py: 0.6,
                                        fontWeight: 600,
                                        border: "2px solid #000000",
                                    }}
                                >
                                    {chip.text}
                                </Box>
                            ))}
                        </Stack>
                    </Stack>
                </Box>
            </Stack>

            <PasswordModal
                open={passwordModalOpen}
                mode="unlock"
                title="Confirmar Reset"
                description="Ingresa tu contraseña para confirmar el borrado total de la cuenta."
                onSuccess={handleResetConfirm}
                onClose={() => setPasswordModalOpen(false)}
            />
        </>
    );
};
