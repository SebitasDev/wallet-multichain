import { EventEmitter } from "events";

declare global {
    // @ts-ignore
    var __bridgeEmitter: EventEmitter | undefined;
}

const emitter =
    globalThis.__bridgeEmitter ??
    new EventEmitter();

// Evita warnings por listeners
emitter.setMaxListeners(100);

// Guardar solo si no existe
if (!globalThis.__bridgeEmitter) {
    globalThis.__bridgeEmitter = emitter;
}

export default emitter;
