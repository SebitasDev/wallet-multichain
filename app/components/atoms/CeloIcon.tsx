import { Box } from "@mui/material";

export default function CeloIcon({ size = 28 }) {
    return (
        <Box
            component="svg"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 120 120"
            sx={{ width: size, height: size }}
        >
            <path
                fill="#FCFE53"
                d="M60 0C26.863 0 0 26.863 0 60s26.863 60 60 60 60-26.863 60-60S93.137 0 60 0"
            />
            <path
                fill="#000"
                d="M90 30H30v60h60V69.055h-9.963C76.606 76.7 68.882 82.01 60.047 82.01c-12.188 0-22.057-9.963-22.057-22.057-.016-12.094 9.869-21.963 22.057-21.963 9.008 0 16.731 5.483 20.162 13.3H90z"
            />
        </Box>
    );
}
