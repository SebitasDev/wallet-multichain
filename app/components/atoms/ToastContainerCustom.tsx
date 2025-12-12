import { Box, Typography } from "@mui/material"
import { ToastContainer } from "react-toastify"

export const ToastContainerCustom = () => {
    return <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick={true}
        pauseOnFocusLoss={false}
        draggable={true}
        pauseOnHover={true}
        theme="light"
        style={{
            width: "auto",
            maxWidth: "420px",
        }}
        toastStyle={{
            background: "#ffffff",
            border: "3px solid #000000",
            borderRadius: "12px",
            boxShadow: "4px 4px 0px 0px rgba(0,0,0,1)",
            padding: "16px",
            marginBottom: "12px",
            fontFamily: "inherit",
            transition: "all 0.2s",
        }}
        // @ts-ignore
        bodyStyle={{
            padding: 0,
            margin: 0,
            fontWeight: 800,
            fontSize: "14px",
            color: "#000000",
        }}
        progressStyle={{
            background: "#000000",
            height: "3px",
        }}
        closeButton={({ closeToast }) => (
            <Box
                component="button"
                onClick={closeToast}
                sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#ffffff",
                    border: "2px solid #000000",
                    borderRadius: 2,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    "&:hover": {
                        background: "#f5f5f5",
                        transform: "scale(1.05)",
                    },
                }}
            >
                <Typography sx={{ color: "#000000", fontWeight: 800, fontSize: 18, lineHeight: 1 }}>
                    ×
                </Typography>
            </Box>
        )}
    />
}