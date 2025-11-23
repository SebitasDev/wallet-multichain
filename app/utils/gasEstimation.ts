// Placeholder for Circle bridge estimation/execute utilities.
// The real implementation depends on @circle-fin/bridge-kit, no longer bundled in this build.

export type BridgeParams = any;

export async function estimateBridge(_params: BridgeParams) {
  return { ok: false, error: "Bridge kit no disponible en este despliegue" };
}

export async function executeBridge(_params: BridgeParams) {
  return { ok: false, error: "Bridge kit no disponible en este despliegue" };
}

export async function estimateAndBridge(_params: BridgeParams) {
  return { ok: false, error: "Bridge kit no disponible en este despliegue" };
}

export async function estimateBaseToEthereum(_amount: string) {
  return { ok: false, error: "Bridge kit no disponible en este despliegue" };
}
