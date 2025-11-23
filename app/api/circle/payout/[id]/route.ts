"use server";

import { NextRequest, NextResponse } from "next/server";
import { getCircleApiKey } from "../../utils";

const CIRCLE_BASE = "https://api-sandbox.circle.com";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const apiKeyResult = getCircleApiKey();
    if (!apiKeyResult.ok) {
      return NextResponse.json({ error: apiKeyResult.error }, { status: 500 });
    }
    const apiKey = apiKeyResult.key;

    const res = await fetch(`${CIRCLE_BASE}/v1/businessAccount/payouts/${params.id}`, {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${apiKey}`,
      },
    });

    const json = await res.json();
    if (!res.ok) {
      const detail =
        res.status === 401
          ? "Circle devolvió 401 (revisa que CIRCLE_API_KEY sea de sandbox y tenga 3 partes separadas por ':')."
          : undefined;
      return NextResponse.json({ error: json, detail }, { status: res.status });
    }
    return NextResponse.json(json);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Error inesperado" }, { status: 500 });
  }
}
