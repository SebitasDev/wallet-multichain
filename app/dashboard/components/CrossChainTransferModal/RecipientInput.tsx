import { Box, Typography, TextField } from "@mui/material";
import { Controller, Control } from "react-hook-form";
import { FormValues } from "@/app/dashboard/hooks/transfer/useCrossChainTransfer";

type RecipientInputProps = {
    control: Control<FormValues>;
};

export const RecipientInput = ({ control }: RecipientInputProps) => (
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
            Address destino
        </Typography>
        <Controller
            control={control}
            name="recipient"
            render={({ field }) => (
                <TextField
                    placeholder="0x..."
                    fullWidth
                    {...field}
                    InputProps={{
                        sx: {
                            borderRadius: 2,
                            background: "#f5f5f5",
                            border: "2px solid #000000",
                            fontWeight: 600,
                            fontFamily: "monospace",
                            "&:hover": {
                                background: "#ffffff",
                            },
                            "&.Mui-focused": {
                                background: "#ffffff",
                            }
                        }
                    }}
                />
            )}
        />
    </Box>
);
