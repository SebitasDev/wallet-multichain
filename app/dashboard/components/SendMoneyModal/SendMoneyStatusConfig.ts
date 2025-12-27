
import AutorenewIcon from "@mui/icons-material/Autorenew";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import MoveUpIcon from '@mui/icons-material/MoveUp';
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import React from "react";

export const STATUS_META = {
    idle: { label: "Pendiente", icon: React.createElement(HourglassEmptyIcon), color: "#cccccc" },
    starting: { label: "Iniciando", icon: React.createElement(RocketLaunchIcon), color: "#3CD2FF" },
    approving: { label: "Aprobando", icon: React.createElement(AutorenewIcon, { sx: { animation: "spin 1.2s linear infinite" } }), color: "#7852FF" },
    burning: { label: "Quemando", icon: React.createElement(LocalFireDepartmentIcon), color: "#FF0420" },
    waiting: { label: "Esperando", icon: React.createElement(HourglassBottomIcon), color: "#FF007A" },
    minting: { label: "Minteando", icon: React.createElement(AutorenewIcon, { sx: { animation: "spin 1.2s linear infinite" } }), color: "#8247E5" },
    transfer: { label: "Transfiriendo", icon: React.createElement(MoveUpIcon), color: "#28A0F0" },
    done: { label: "Completado", icon: React.createElement(CheckCircleIcon), color: "#00DC8C" },
    error: { label: "Error", icon: React.createElement(ErrorIcon), color: "#ff4444" },
} as const;
