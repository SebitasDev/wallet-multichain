import { Avatar, Box, Stack } from "@mui/material";

export const TopBarProfile = () => {
    return (
        <Stack direction="row" spacing={2} alignItems="center">
            {/* Avatar */}
            <Avatar
                id="tour-profile"
                src="https://i.postimg.cc/0jx6tjVZ/photo-5033044889268063043-y.jpg"
                sx={{
                    width: 54,
                    height: 54,
                    border: "2px solid #000000",
                }}
            />

            {/* Badges Container */}
            <Box sx={{ overflow: "hidden", maxWidth: { xs: "240px", sm: "none" } }}>
                <style>
                    {`
                    @keyframes scroll {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    `}
                </style>

                {/* MOBILE CAROUSEL (Visible only on xs) */}
                <Box
                    sx={{
                        display: { xs: "flex", sm: "none" },
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        width: "100%",
                        maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
                        WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            animation: "scroll 15s linear infinite",
                            gap: 1,
                            pr: 1,
                        }}
                    >
                        {/* Duplicate items for seamless loop */}
                        {[...Array(4)].map((_, i) => (
                            <Box key={i} sx={{ display: "flex", gap: 1 }}>
                                {[
                                    { text: "6 chains", bgColor: "#f5f5f5" },
                                    { text: "$0.01 Fee", bgColor: "#f5f5f5" },
                                    { text: "15% APY", bgColor: "#f5f5f5" },
                                ].map((chip, idx) => (
                                    <Box
                                        key={`${i}-${idx}`}
                                        sx={{
                                            background: chip.bgColor,
                                            color: "#000000",
                                            borderRadius: "999px",
                                            fontSize: 12,
                                            px: 1.6,
                                            py: 0.6,
                                            fontWeight: 600,
                                            border: "2px solid #000000",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {chip.text}
                                    </Box>
                                ))}
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* DESKTOP STATIC (Visible on sm+) */}
                <Stack
                    spacing={1}
                    sx={{ display: { xs: "none", sm: "flex" } }}
                >
                    <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        justifyContent={{ xs: "flex-start", sm: "flex-start" }}
                    >
                        {[
                            { text: "6 chains", bgColor: "#f5f5f5" },
                            { text: "$0.01 Fee", bgColor: "#f5f5f5" },
                            { text: "15% APY", bgColor: "#f5f5f5" },
                        ].map((chip) => (
                            <Box
                                key={chip.text}
                                sx={{
                                    background: chip.bgColor,
                                    color: "#000000",
                                    borderRadius: "999px",
                                    fontSize: 12,
                                    px: 1.6,
                                    py: 0.6,
                                    fontWeight: 600,
                                    border: "2px solid #000000",
                                }}
                            >
                                {chip.text}
                            </Box>
                        ))}
                    </Stack>
                </Stack>
            </Box>
        </Stack>
    );
};
