import { Box } from "@mui/material";
import { useTopBar } from "@/app/dashboard/hooks/dashboard/useTopBar";
import { TopBarProfile } from "./TopBarProfile";
import { TopBarActions } from "./TopBarActions";
import { useRouter } from "next/navigation";

export function TopBar() {
    const { handleSavings, handleCrossChain } = useTopBar();

    const router = useRouter();

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
                onCrossChain={handleCrossChain}
                onSavings={handleSavings}
                onCTF={() => router.push("/dashboard/ctf")}
            />
        </Box>
    );
}
