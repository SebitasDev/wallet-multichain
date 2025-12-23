
"use client";

import { Box } from "@mui/material";
import { BlendLending } from "@/app/dashboard/components/BlendLending";
import { TopBar } from "@/app/dashboard/components/TopBar";

export default function BlendPage() {
    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: "#fff",
                pb: 6,
            }}
        >
            <TopBar />
            <Box sx={{ pt: { xs: 2, md: 4 } }}>
                <BlendLending />
            </Box>
        </Box>
    );
}
