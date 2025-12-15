import { Box } from "@mui/material";
import { useTopBar } from "@/app/dashboard/hooks/useTopBar";
import { TopBarProfile } from "./TopBarProfile";
import { TopBarActions } from "./TopBarActions";

export function TopBar() {
    const { handleSend, handleReceive, handleAdd, handleSavings } = useTopBar();

    return (
        <Box
            sx={{
                width: "100%",
                mx: "auto",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: "center",
                gap: { xs: 2.5, sm: 3 },
                px: { xs: 3, md: 4 },
                py: { xs: 2.5, md: 3 },
                background: "#ffffff",
                border: "3px solid #000000",
                borderRadius: 4,
                boxShadow: "6px 6px 0px #000000",
                mb: 2,
                mt: 1
            }}
        >
            <TopBarProfile />

            <TopBarActions
                onSend={handleSend}
                onReceive={handleReceive}
                onAdd={handleAdd}
                onSavings={handleSavings}
            />
        </Box>
    );
}
