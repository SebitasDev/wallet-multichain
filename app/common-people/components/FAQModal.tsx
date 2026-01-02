
"use client";

import { Box, Typography, Modal, Accordion, AccordionSummary, AccordionDetails, IconButton } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import { useLanguageStore } from "@/app/store/useLanguageStore";

const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: 500,
    bgcolor: 'background.paper',
    border: '3px solid #000',
    boxShadow: "8px 8px 0px #000",
    borderRadius: "16px",
    p: 4,
    maxHeight: '80vh',
    overflowY: 'auto'
};

interface FAQModalProps {
    open: boolean;
    onClose: () => void;
}

export function FAQModal({ open, onClose }: FAQModalProps) {
    const { language } = useLanguageStore();

    const faqData = [
        {
            q_es: "¿Cómo puedo depositar fondos?",
            q_en: "How can I deposit funds?",
            a_es: "Puedes depositar criptomonedas directamente a tu dirección de billetera copiándola desde la tarjeta de la red correspondiente en el inicio. También puedes comprar con tarjeta si está disponible en tu región.",
            a_en: "You can deposit cryptocurrencies directly to your wallet address by copying it from the corresponding chain card on the home screen. You can also buy with card if available in your region."
        },
        {
            q_es: "¿Es segura esta billetera?",
            q_en: "Is this wallet safe?",
            a_es: "Sí, 1llet es una billetera no custodia. Tú tienes el control total de tus claves privadas y fondos. Nunca compartas tu frase semilla con nadie.",
            a_en: "Yes, 1llet is a non-custodial wallet. You have full control over your private keys and funds. Never share your seed phrase with anyone."
        },
        {
            q_es: "¿Cuáles son las comisiones?",
            q_en: "What are the fees?",
            a_es: "1llet no cobra comisiones ocultas. Solo pagas las tarifas de gas de la red blockchain que utilices para tus transacciones.",
            a_en: "1llet charges no hidden fees. You only pay the gas fees of the blockchain network you use for your transactions."
        },
        {
            q_es: "¿Cómo recupero mi cuenta?",
            q_en: "How do I recover my account?",
            a_es: "Puedes recuperar tu cuenta en cualquier dispositivo utilizando tu Frase de Recuperación (Semilla) de 12 palabras. Asegúrate de tener una copia de seguridad.",
            a_en: "You can recover your account on any device using your 12-word Recovery Phrase (Seed). Make sure you have a backup."
        }
    ];

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="faq-modal-title"
        >
            <Box sx={style}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography id="faq-modal-title" variant="h5" component="h2" fontWeight={900}>
                        {language === "es" ? "Preguntas Frecuentes" : "FAQ"}
                    </Typography>
                    <IconButton
                        onClick={onClose}
                        sx={{
                            backgroundColor: "#f3f4f6",
                            borderRadius: "12px",
                            p: 1,
                            transition: "all 0.2s",
                            "&:hover": {
                                backgroundColor: "#e5e7eb",
                                transform: "rotate(90deg)"
                            },
                        }}
                    >
                        <CloseIcon sx={{ fontSize: 20, color: "black" }} />
                    </IconButton>
                </Box>

                <Box>
                    {faqData.map((faq, index) => (
                        <Accordion
                            key={index}
                            disableGutters
                            elevation={0}
                            sx={{
                                border: '2px solid #000',
                                borderRadius: '8px !important',
                                mb: 2,
                                '&:before': { display: 'none' },
                                boxShadow: '4px 4px 0px #000',
                            }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon sx={{ color: "black" }} />}
                                aria-controls={`panel${index}-content`}
                                id={`panel${index}-header`}
                                sx={{
                                    bgcolor: '#f4f4f5',
                                    borderRadius: '8px',
                                    fontWeight: 700
                                }}
                            >
                                <Typography fontWeight={700}>
                                    {language === "es" ? faq.q_es : faq.q_en}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ bgcolor: 'white', borderRadius: '0 0 8px 8px' }}>
                                <Typography color="text.secondary">
                                    {language === "es" ? faq.a_es : faq.a_en}
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            </Box>
        </Modal>
    );
}
