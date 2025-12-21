"use client";

import { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    Container,
    Select,
    MenuItem
} from "@mui/material";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Language, SectionKey } from "./types";
import DocsSidebar from "./components/layout/DocsSidebar";
import IntroSection from "./components/intro/IntroSection";
import UsdcToXlmSection from "./components/bridge/stellar/UsdcToXlmSection";
import UsdcToUsdcSection from "./components/bridge/stellar/UsdcToUsdcSection";
import QuoteSection from "./components/bridge/quote/QuoteSection";
import GaslessPaySection from "./components/bridge/gasless/GaslessPaySection";

export default function DocsPage() {
    const [language, setLanguage] = useState<Language>('en');
    const [section, setSection] = useState<SectionKey>('bridge-stellar-xlm');
    const [baseUrl, setBaseUrl] = useState("");

    useEffect(() => {
        setBaseUrl(window.location.origin);
    }, []);

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#FAFAFA" }}>
            <ToastContainer />

            {/* Header / Top Bar */}
            <Box sx={{
                bgcolor: "#fff",
                borderBottom: "3px solid #000",
                px: { xs: 2, md: 4 },
                py: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
            }}>
                <Typography variant="h6" fontWeight={900} sx={{ display: "flex", alignItems: "center", gap: 1, textTransform: "uppercase", letterSpacing: 1 }}>
                    ⚡ 1LLET Docs
                </Typography>
                <Select
                    size="small"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    sx={{
                        bgcolor: "#fff",
                        borderRadius: 1,
                        border: "2px solid #000",
                        boxShadow: "2px 2px 0px #000",
                        fontWeight: "bold",
                        ".MuiOutlinedInput-notchedOutline": { border: "none" }
                    }}
                >
                    <MenuItem value="en">🇺🇸 English</MenuItem>
                    <MenuItem value="es">🇪🇸 Español</MenuItem>
                </Select>
            </Box>

            <Container maxWidth="xl" sx={{ mt: 5 }}>
                <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 4 }}>

                    {/* LEFT CONTENT AREA */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Paper sx={{
                            p: { xs: 3, md: 6 },
                            borderRadius: 2,
                            minHeight: "80vh",
                            border: "2px solid #000",
                            boxShadow: "6px 6px 0px #000"
                        }}>

                            {section === 'introduction' && (
                                <IntroSection language={language} baseUrl={baseUrl} />
                            )}

                            {section === 'bridge-stellar-xlm' && <UsdcToXlmSection language={language} baseUrl={baseUrl} />}
                            {section === 'bridge-stellar-usdc' && <UsdcToUsdcSection language={language} baseUrl={baseUrl} />}
                            {section === 'quote' && <QuoteSection language={language} baseUrl={baseUrl} />}
                            {section === 'gasless' && <GaslessPaySection language={language} baseUrl={baseUrl} />}

                        </Paper>
                    </Box>

                    {/* RIGHT SIDEBAR MENU */}
                    <Box sx={{ width: { xs: "100%", md: 300 }, flexShrink: 0, order: { xs: -1, md: 1 } }}>
                        <DocsSidebar
                            language={language}
                            currentSection={section}
                            onSectionChange={setSection}
                        />
                    </Box>

                </Box>
            </Container>
        </Box>
    );
}
