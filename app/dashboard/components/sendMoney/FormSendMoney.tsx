import {Control, Controller, FieldErrors} from "react-hook-form";
import {MenuItem, Stack, TextField, Typography} from "@mui/material";
import {ChainKey, NETWORKS} from "@/app/constants/chainsInformation";

type FormValues = {
    toAddress: string
    sendAmount: string
    sendPassword: string
    sendChain: ChainKey
};

type Props = {
    control: Control<FormValues>;
    errors: FieldErrors<FormValues>;
    sendLoading: boolean;
};

export const FormSendMoney = ({ control, errors, sendLoading }: Props) => {
    return (
        <Stack spacing={2.2}>
            <Controller
                control={control}
                name="sendChain"
                render={({ field }) => (
                    <TextField
                        select
                        label="Chain destino"
                        fullWidth
                        size="medium"
                        disabled={sendLoading}
                        {...field}
                        error={!!errors.sendChain}
                        helperText={errors.sendChain?.message}
                    >
                        {Object.entries(NETWORKS).map(([key, cfg]) => (
                            <MenuItem key={key} value={key}>
                                <Stack direction="row" alignItems="center" spacing={1.2}>
                                    {cfg.icon}
                                    <Typography>{cfg.label}</Typography>
                                </Stack>
                            </MenuItem>
                        ))}
                    </TextField>
                )}
            />

            <Controller
                control={control}
                name="toAddress"
                render={({ field }) => (
                    <TextField
                        label="Address destino"
                        fullWidth
                        size="medium"
                        placeholder="0x..."
                        disabled={sendLoading}
                        {...field}
                        error={!!errors.toAddress}
                        helperText={errors.toAddress?.message}
                    />
                )}
            />

            <Controller
                control={control}
                name="sendAmount"
                render={({ field }) => (
                    <TextField
                        label="Monto"
                        fullWidth
                        size="medium"
                        placeholder="0.00"
                        type="number"
                        inputProps={{ min: 0, step: "0.0001" }}
                        disabled={sendLoading}
                        {...field}
                        error={!!errors.sendAmount}
                        helperText={errors.sendAmount?.message}
                    />
                )}
            />

            <Controller
                control={control}
                name="sendPassword"
                render={({ field }) => (
                    <TextField
                        label="Password de la wallet"
                        fullWidth
                        size="medium"
                        type="password"
                        placeholder="********"
                        disabled={sendLoading}
                        {...field}
                        error={!!errors.sendPassword}
                        helperText={errors.sendPassword?.message}
                    />
                )}
            />
        </Stack>
    );
};
