"use client";
import React, { useEffect } from "react";
import { CHAIN_CONFIGS } from "@1llet.xyz/erc4337-gasless-sdk";

export const DebugSdk = () => {
    useEffect(() => {
        console.log("DEBUG: CHAIN_CONFIGS keys:", Object.keys(CHAIN_CONFIGS));
        console.log("DEBUG: CHAIN_CONFIGS[5000]:", CHAIN_CONFIGS[5000]);
        console.log("DEBUG: CHAIN_CONFIGS['Stacks']:", CHAIN_CONFIGS["Stacks" as any]);
    }, []);

    return <div style={{ display: "none" }}>Debug SDK</div>;
};
