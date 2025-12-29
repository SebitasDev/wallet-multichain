"use client";

import { Box, Modal, Stack } from "@mui/material";
import { useEffect } from "react";
import { usePasswordModal } from "@/app/dashboard/hooks/common/usePasswordModal";
import { PasswordModalHeader } from "./PasswordModalHeader";
import { PasswordModalForm } from "./PasswordModalForm";
import { PasswordModalActions } from "./PasswordModalActions";


type PasswordModalProps = {
    open: boolean;
    mode: "create" | "unlock";
    onSuccess: () => void;
    onClose?: () => void;
    title?: string;
    description?: string;
};

export const PasswordModal = ({ open, mode, onSuccess, onClose, title, description }: PasswordModalProps) => {
    const {
        password,
        setPassword,
        error,
        setError,
        showPassword,
        setShowPassword,
        isSubmitting,
        isEmpty,
        errorId,
        handleSubmit
    } = usePasswordModal({ mode, onSuccess });

    return (
        <Modal open={open} onClose={onClose}>
            <Box
                sx={{
                    position: "fixed",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 2,
                    background: "#000000", // Full black background
                    overflowY: "auto", // Allow scrolling if taller than screen
                }}
            >
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                        width: "100%",
                        maxWidth: 480,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        position: "relative",
                        // Scale removed for larger display
                        transformOrigin: "center center"
                    }}
                >
                    <PasswordModalHeader mode={mode} title={title} description={description} onClose={onClose} />

                    <Stack spacing={1} width="100%" alignItems="center">
                        <PasswordModalForm
                            password={password}
                            setPassword={setPassword}
                            error={error}
                            setError={setError}
                            showPassword={showPassword}
                            setShowPassword={setShowPassword}
                            errorId={errorId}
                            mode={mode}
                            onSubmit={() => handleSubmit()}
                        />

                        {/* Actions button removed as requested */}
                    </Stack>
                </Box>
            </Box>
        </Modal>
    );
};
