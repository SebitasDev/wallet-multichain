import {
    Box,
    Typography,
    TextField,
    Stack,
    DialogContent
} from "@mui/material";

interface GenerateWalletModalFormProps {
    walletName: string;
    setWalletName: (val: string) => void;
    password: string;
    setPassword: (val: string) => void;
    mnemonic: string;
}

export const GenerateWalletModalForm = ({
    walletName,
    setWalletName,
    password,
    setPassword,
    mnemonic
}: GenerateWalletModalFormProps) => {
    return (
        <DialogContent sx={{ px: 3, py: 3, background: "#ffffff" }}>
            <Stack spacing={2.5}>
                {/* Wallet Name */}
                <Box>
                    <Typography
                        fontWeight={700}
                        fontSize={13}
                        sx={{
                            mb: 1,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            color: "#666666"
                        }}
                    >
                        Nombre de la wallet
                    </Typography>
                    <TextField
                        fullWidth
                        value={walletName}
                        onChange={(e) => setWalletName(e.target.value)}
                        placeholder="Ej: Mi Wallet"
                        InputProps={{
                            sx: {
                                borderRadius: 2,
                                background: "#f5f5f5",
                                border: "2px solid #000000",
                                fontWeight: 600,
                                "&:hover": {
                                    background: "#ffffff",
                                },
                                "&.Mui-focused": {
                                    background: "#ffffff",
                                }
                            }
                        }}
                    />
                </Box>

                {/* Password */}
                <Box>
                    <Typography
                        fontWeight={700}
                        fontSize={13}
                        sx={{
                            mb: 1,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            color: "#666666"
                        }}
                    >
                        Contraseña
                    </Typography>
                    <TextField
                        fullWidth
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        InputProps={{
                            sx: {
                                borderRadius: 2,
                                background: "#f5f5f5",
                                border: "2px solid #000000",
                                fontWeight: 600,
                                "&:hover": {
                                    background: "#ffffff",
                                },
                                "&.Mui-focused": {
                                    background: "#ffffff",
                                }
                            }
                        }}
                    />
                </Box>

                {/* Mnemonic (Readonly) */}
                <Box>
                    <Typography
                        fontWeight={700}
                        fontSize={13}
                        sx={{
                            mb: 1,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            color: "#666666"
                        }}
                    >
                        Frase secreta (generada automáticamente)
                    </Typography>
                    <TextField
                        fullWidth
                        value={mnemonic}
                        multiline
                        disabled
                        minRows={3}
                        InputProps={{
                            sx: {
                                borderRadius: 2,
                                background: "#f5f5f5",
                                border: "2px solid #000000",
                                fontFamily: "monospace",
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#000000",
                            }
                        }}
                    />
                </Box>
            </Stack>
        </DialogContent>
    );
};
