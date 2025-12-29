
"use client";

import { Box } from "@mui/material";
import { BlendLending } from "@/app/dashboard/components/BlendLending";


export default function BlendPage() {
    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: "#fff",
                pb: 6,
            }}
        >

            <Box sx={{ pt: { xs: 2, md: 4 } }}>
                <BlendLending />
            </Box>
        </Box>
    );
}
