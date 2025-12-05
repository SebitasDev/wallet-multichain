"use client";

import { EmbeddedProvider } from "@/app/dashboard/hooks/embebed";
import { XOContractsProvider } from "@/app/dashboard/hooks/useXOConnect";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <EmbeddedProvider>
            <XOContractsProvider>
                {children}
            </XOContractsProvider>
        </EmbeddedProvider>
    );
}
