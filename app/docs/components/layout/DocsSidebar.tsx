"use client";

import {
    Box,
    Typography,
    Paper,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    List,
    ListItemButton,
    ListItemText,
    Divider
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { SectionKey, Language } from "../../types";

interface DocsSidebarProps {
    language: Language;
    currentSection: SectionKey;
    onSectionChange: (section: SectionKey) => void;
}

export default function DocsSidebar({ language, currentSection, onSectionChange }: DocsSidebarProps) {
    return (
        <Box sx={{ position: { md: "sticky" }, top: 20 }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{
                mb: 2,
                px: 1,
                textTransform: "uppercase",
                borderLeft: "4px solid #000",
                pl: 2,
                fontSize: 14,
                letterSpacing: 1
            }}>
                {language === 'en' ? "Navigation" : "Navegación"}
            </Typography>

            <Paper sx={{
                borderRadius: 2,
                overflow: "hidden",
                border: "2px solid #000",
                boxShadow: "4px 4px 0px #000"
            }} elevation={0}>
                {/* BRIDGE GROUP */}
                <Accordion defaultExpanded disableGutters elevation={0} sx={{ '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography fontWeight={700}>Bridge</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>

                        {/* QUOTE UTILITY */}
                        <ListItemButton
                            selected={currentSection === 'quote'}
                            onClick={() => onSectionChange('quote')}
                            sx={{ pl: 4, borderLeft: currentSection === 'quote' ? "4px solid #1976d2" : "4px solid transparent" }}
                        >
                            <ListItemText
                                primary="Utility: Get Quote"
                                primaryTypographyProps={{ fontSize: 13, fontWeight: currentSection === 'quote' ? 700 : 500 }}
                            />
                        </ListItemButton>

                        <Divider sx={{ my: 1, mx: 2 }} />

                        {/* STELLAR SUB-GROUP */}
                        <Accordion defaultExpanded disableGutters elevation={0} sx={{ '&:before': { display: 'none' }, pl: 2 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography variant="body2" fontWeight={600}>Stellar</Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 0 }}>
                                <List disablePadding>
                                    <ListItemButton
                                        selected={currentSection === 'usdc-xlm'}
                                        onClick={() => onSectionChange('usdc-xlm')}
                                        sx={{ pl: 4, borderLeft: currentSection === 'usdc-xlm' ? "4px solid #1976d2" : "4px solid transparent" }}
                                    >
                                        <ListItemText
                                            primary="USDC → XLM"
                                            primaryTypographyProps={{ fontSize: 13, fontWeight: currentSection === 'usdc-xlm' ? 700 : 500 }}
                                        />
                                    </ListItemButton>
                                    {/* Placeholder for next endpoint */}
                                    <ListItemButton
                                        selected={currentSection === 'usdc-usdc'}
                                        onClick={() => onSectionChange('usdc-usdc')}
                                        sx={{ pl: 4, borderLeft: currentSection === 'usdc-usdc' ? "4px solid #1976d2" : "4px solid transparent" }}
                                    >
                                        <ListItemText
                                            primary="USDC ↔ USDC"
                                            primaryTypographyProps={{ fontSize: 13, fontWeight: currentSection === 'usdc-usdc' ? 700 : 500 }}
                                        />
                                    </ListItemButton>
                                </List>
                            </AccordionDetails>
                        </Accordion>

                    </AccordionDetails>
                </Accordion>

                <Divider />

                <ListItemButton onClick={() => onSectionChange('intro')}>
                    <ListItemText primary={language === 'en' ? "Introduction" : "Introducción"} />
                </ListItemButton>
            </Paper>
        </Box>
    );
}
