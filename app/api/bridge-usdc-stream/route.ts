// app/api/bridge-usdc-stream/route.ts
import bridgeEmitter from "@/app/lib/bridgeEmitter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    let controllerRef: ReadableStreamDefaultController | null = null;
    let closed = false;

    const stream = new ReadableStream({
        start(controller) {
            controllerRef = controller;

            const safeSend = (event: string, data: any) => {
                if (closed) return;          // ❗ evita crash
                try {
                    controller.enqueue(`event: ${event}\n`);
                    controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
                } catch (err) {
                    // ❗ el stream murió → marcar como cerrado
                    closed = true;
                }
            };

            // Envia "connected"
            safeSend("connected", { ok: true });

            // handler único por request
            const handler = (payload: any) => {
                safeSend("chain-step", payload);
            };

            // registra
            bridgeEmitter.on("chain-step", handler);

            // cleanup cuando el cliente cierre conexión
            const interval = setInterval(() => {
                if (closed) {
                    clearInterval(interval);
                    bridgeEmitter.off("chain-step", handler);
                }
            }, 500);
        },

        cancel() {
            closed = true;
            controllerRef = null;
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
        },
    });
}
