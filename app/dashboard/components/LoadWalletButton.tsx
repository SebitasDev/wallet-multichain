
import { Button } from "@mui/material";
import { useState } from "react";
import { LoadWalletModal } from "./LoadWalletModal";
import FileUploadIcon from "@mui/icons-material/FileUpload";

export const LoadWalletButton = () => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                id="tour-load-wallet"
                variant="outlined"
                onClick={() => setOpen(true)}
                startIcon={<FileUploadIcon />}
                sx={{
                    border: "2px solid #000",
                    color: "black",
                    fontWeight: "bold",
                    bgcolor: "white",
                    boxShadow: "4px 4px 0px #000",
                    "&:hover": {
                        bgcolor: "#eee",
                        boxShadow: "2px 2px 0px #000",
                        transform: "translate(2px, 2px)"
                    }
                }}
            >
                Cargar Wallet
            </Button>

            <LoadWalletModal open={open} onClose={() => setOpen(false)} />
        </>
    );
};
