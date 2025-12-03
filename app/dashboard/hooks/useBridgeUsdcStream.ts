import { useEffect, useRef } from "react";

export function useBridgeUsdcStream(onEvent: (event: { type: string; payload: any }) => void) {
    const esRef = useRef<EventSource | null>(null);
    const onEventRef = useRef(onEvent);

    useEffect(() => {
        onEventRef.current = onEvent;
    }, [onEvent]);

    useEffect(() => {
        if (esRef.current) return; // Evita reconectar

        const url = "/api/bridge-usdc-stream";
        const es = new EventSource(url);
        esRef.current = es;

        console.log("SSE conectado a", url);

        es.addEventListener("open", () => {
            console.log("SSE conectado a", url);
        });

        es.addEventListener("error", (ev) => {
            console.warn("SSE error:", ev);
        });

        const handle = (type: string) => (e: MessageEvent) => {
            try {
                const data = JSON.parse(e.data);
                onEventRef.current({ type, payload: data });
            } catch {
                onEventRef.current({ type, payload: e.data });
            }
        };

        es.addEventListener("message", handle("message"));
        es.addEventListener("connected", handle("connected"));
        es.addEventListener("chain-step", handle("chain-step"));

        return () => {
            console.log("SSE desconectando:", url);
            es.close();
            esRef.current = null;
        };
    }, []);

}
