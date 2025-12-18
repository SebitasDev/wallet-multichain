import { Box, Modal, Stack } from "@mui/material";
import { usePasswordModal } from "@/app/dashboard/hooks/usePasswordModal";
import { PasswordModalHeader } from "./PasswordModalHeader";
import { PasswordModalForm } from "./PasswordModalForm";
import { PasswordModalActions } from "./PasswordModalActions";

type PasswordModalProps = {
    open: boolean;
    mode: "create" | "unlock";
    onSuccess: () => void;
    onClose?: () => void;
};

export const PasswordModal = ({ open, mode, onSuccess, onClose }: PasswordModalProps) => {
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
                    background: "rgba(0,0,0,0.4)",
                }}
            >
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{
                        width: "100%",
                        maxWidth: 460,
                        background: "#ffffff",
                        border: "4px solid #000000",
                        boxShadow: "12px 12px 0px #000000",
                        borderRadius: 4,
                        p: { xs: 3, md: 4 },
                        position: "relative",
                        animation: "modalSlideIn 0.3s ease-out",
                        "@keyframes modalSlideIn": {
                            from: {
                                opacity: 0,
                                transform: "translateY(-20px) scale(0.95)",
                            },
                            to: {
                                opacity: 1,
                                transform: "translateY(0) scale(1)",
                            },
                        },
                    }}
                >
                    <PasswordModalHeader mode={mode} />

                    <Stack spacing={2.5}>
                        <PasswordModalForm
                            password={password}
                            setPassword={setPassword}
                            error={error}
                            setError={setError}
                            showPassword={showPassword}
                            setShowPassword={setShowPassword}
                            errorId={errorId}
                            mode={mode}
                        />

                        <PasswordModalActions
                            isSubmitting={isSubmitting}
                            isEmpty={isEmpty}
                            mode={mode}
                        />
                    </Stack>
                </Box>
            </Box>
        </Modal>
    );
};
