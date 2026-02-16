"use client";
import React, { useEffect, useState } from "react";
import { TransferManager, CHAIN_CONFIGS } from "@1llet.xyz/erc4337-gasless-sdk";

export const DebugStrategy = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

    useEffect(() => {
        const runDebug = async () => {
            try {
                addLog("--- FULL SDK CONFIG DUMP ---");

                // 1. Dump Configs
                const baseConfig = (CHAIN_CONFIGS as any)[8453];
                const stacksConfig = (CHAIN_CONFIGS as any)[5000];

                addLog(`Base (8453): ${JSON.stringify(baseConfig, null, 2)}`);
                addLog(`Stacks (5000): ${JSON.stringify(stacksConfig, null, 2)}`);

            } catch (e: any) {
                addLog(`Error: ${e.message}`);
            }
        };

        runDebug();
    }, []);

    return (
        <div style={{
            padding: 20,
            background: "#000",
            color: "#0f0",
            fontFamily: "monospace",
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            height: "400px",
            overflow: "auto",
            zIndex: 99999,
            borderTop: "2px solid #555",
            whiteSpace: "pre-wrap" // Important for JSON formatting
        }}>
            <h3 style={{ margin: "0 0 10px 0" }}>SDK Config Dump</h3>
            {logs.map((l, i) => <div key={i} style={{ marginBottom: 10, borderBottom: "1px dashed #333" }}>{l}</div>)}
        </div>
    );
};
