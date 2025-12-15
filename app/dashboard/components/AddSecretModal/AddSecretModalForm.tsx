import {
    Box,
    Typography,
    TextField,
    Stack,
    DialogContent
} from "@mui/material";

interface AddSecretModalFormProps {
    walletName: string;
    setWalletName: (val: string) => void;
    phrase: string;
    setPhrase: (val: string) => void;
    password: string;
    setPassword: (val: string) => void;
    has12Words: boolean;
    wordsCount: number;
    hasEncryptedPassword: boolean;
}

export const AddSecretModalForm = ({
    walletName,
    setWalletName,
    phrase,
    setPhrase,
    password,
    setPassword,
    has12Words,
    wordsCount,
    hasEncryptedPassword
}: AddSecretModalFormProps) => {
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
                        Nombre de la Wallet
                    </Typography>

                    <TextField
                        fullWidth
                        size="medium"
                        value={walletName}
                        onChange={({ target }) => setWalletName(target.value)}
                        placeholder="Ej: Mi Wallet Principal"
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
                            },
                        }}
                    />
                </Box>

                {/* Seed Phrase */}
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
                        Frase secreta (12 palabras)
                    </Typography>

                    <TextField
                        fullWidth
                        size="medium"
                        value={phrase}
                        onChange={({ target }) => setPhrase(target.value)}
                        placeholder="palabra1 palabra2 ... palabra12"
                        InputProps={{
                            sx: {
                                borderRadius: 2,
                                background: "#f5f5f5",
                                border: "2px solid #000000",
                                fontWeight: 600,
                                fontFamily: "monospace",
                                fontSize: 13,
                                "&:hover": {
                                    background: "#ffffff",
                                },
                                "&.Mui-focused": {
                                    background: "#ffffff",
                                }
                            },
                        }}
                        multiline
                        minRows={3}
                        helperText={
                            <Box
                                component="span"
                                sx={{
                                    fontWeight: 600,
                                    fontSize: 12,
                                    color: has12Words ? "#00DC8C" : "#666666"
                                }}
                            >
                                {phrase ? `${wordsCount}/12 palabras` : "Debe tener 12 palabras exactas."}
                            </Box>
                        }
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
                        Password
                        {hasEncryptedPassword ? " (para desbloquear)" : " (para cifrar)"}
                    </Typography>

                    <TextField
                        fullWidth
                        size="medium"
                        type="password"
                        value={password}
                        onChange={({ target }) => setPassword(target.value)}
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
                            },
                        }}
                    />
                </Box>
            </Stack>
        </DialogContent>
    );
};
