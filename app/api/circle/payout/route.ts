"use server";

import { NextRequest, NextResponse } from "next/server";
import { getCircleApiKey } from "../utils";

const CIRCLE_BASE = "https://api-sandbox.circle.com";

export async function POST(req: NextRequest) {
  try {
    const apiKeyResult = getCircleApiKey();
    if (!apiKeyResult.ok) {
      return NextResponse.json({ error: apiKeyResult.error }, { status: 500 });
    }
    const apiKey = apiKeyResult.key;

    const body = await req.json();
    const res = await fetch(`${CIRCLE_BASE}/v1/businessAccount/payouts`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
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
