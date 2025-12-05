"use client";

import dynamic from "next/dynamic";
import {EmbeddedProvider} from "@/app/dashboard/hooks/embebed";

const XOContractsProvider = dynamic(
    () =>
        import("@/app/dashboard/hooks/useGeneralWallet").then(
            (m) => m.XOContractsProvider
        ),
    { ssr: false }
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <EmbeddedProvider>
        <XOContractsProvider>
            {children}
        </XOContractsProvider>
    </EmbeddedProvider>;
}
