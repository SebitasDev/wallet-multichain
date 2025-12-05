"use client";

import dynamic from "next/dynamic";

const XOContractsProvider = dynamic(
    () =>
        import("@/app/dashboard/hooks/useGeneralWallet").then(
            (m) => m.XOContractsProvider
        ),
    { ssr: false }
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <XOContractsProvider>{children}</XOContractsProvider>;
}
