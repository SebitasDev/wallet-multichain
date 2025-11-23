export function getCircleApiKey() {
  const raw =
    process.env.CIRCLE_API_KEY ||
    process.env.NEXT_PUBLIC_CIRCLE_API_KEY ||
    "";
  // Limpieza básica: recorta espacios/saltos y quita comillas si las hubiera.
  const cleaned = raw.trim().replace(/^['"]|['"]$/g, "");
  if (!cleaned) return { ok: false, error: "CIRCLE_API_KEY no configurada" };
  if (cleaned.split(":").length !== 3) {
    return {
      ok: false,
      error:
        "CIRCLE_API_KEY con formato inválido (debe tener 3 partes separadas por ':')",
    };
  }
  return { ok: true, key: cleaned };
}
