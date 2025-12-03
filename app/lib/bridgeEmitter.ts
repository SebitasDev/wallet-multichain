import { EventEmitter } from "events";

declare global {
    // Evita errores y duplicados en hot reload
    // @ts-ignore
    var __bridgeEmitter: EventEmitter | undefined;
}

const emitter = global.__bridgeEmitter ?? new EventEmitter();

// Evita warnings y desconexiones al tener muchos listeners
emitter.setMaxListeners(100);

// Guardar el emitter global la primera vez
if (!global.__bridgeEmitter) {
    global.__bridgeEmitter = emitter;
}

export default emitter;
