
import { Box } from "@mui/material";

// Helper for Flags
export const FlagIcon = ({ countryCode }: { countryCode: string }) => {
    const src = `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`;
    return (
        <Box
            component="img"
            src={src}
            alt={countryCode}
            sx={{
                width: 32,
                height: 24,
                objectFit: "cover",
                borderRadius: "4px",
                border: "1px solid #000"
            }}
        />
    );
};
