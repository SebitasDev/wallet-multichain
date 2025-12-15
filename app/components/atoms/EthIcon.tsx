import { Box } from "@mui/material";

export const EthIcon = () => {
    return (
        <Box
            component="svg"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 120 120"
            sx={{ width: 28, height: 28 }}
        >
            <circle cx="60" cy="60" r="60" fill="#627EEA" />

            <path
                fill="#C0CCF7"
                d="m59.837 24-.478 1.621v47.042l.478.476 21.835-12.907z"
            />
            <path
                fill="#fff"
                d="M59.836 24 38 60.232l21.836 12.907V24"
            />
            <path
                fill="#C0CCF7"
                d="m59.836 77.273-.269.329v16.757l.27.785 21.849-30.771z"
            />
            <path
                fill="#fff"
                d="M59.836 95.144v-17.87L38 64.372z"
            />
            <path
                fill="#8198EE"
                d="m59.836 73.14 21.836-12.908-21.836-9.926z"
            />
            <path
                fill="#C0CCF7"
                d="m38 60.232 21.836 12.907V50.306z"
            />
        </Box>
    );
};
