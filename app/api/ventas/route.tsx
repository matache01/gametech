"use server";

const BACKEND_BASE =
  process.env.BACKEND_BASE_URL ||
  "https://backendtransaccionesgametech-production-0823.up.railway.app";

const API_PREFIX = "/api/pedidos";

async function forwardFetch(path: string, init?: RequestInit) {
  const url = `${BACKEND_BASE}${path}`;
  const res = await fetch(url, {
    // Ensure we send/accept JSON by default
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init && init.headers ? (init.headers as Record<string, string>) : {}),
    },
    ...init,
  });
  const text = await res.text();
  // Try parse JSON, but if not JSON return raw text
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, ok: res.ok, data };
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split("/").filter(Boolean);
    // segments example: ["api","ventas","123"] or ["api","ventas","usuario","45"]
    const ventasIndex = segments.findIndex((s) => s === "ventas");
    const after = ventasIndex >= 0 ? segments.slice(ventasIndex + 1) : [];

    // route forms supported:
    // - GET /api/ventas -> list all (backend: GET /api/pedidos)
    // - GET /api/ventas/{id} -> get by id (backend: GET /api/pedidos/{id})
    // - GET /api/ventas/usuario/{usuarioId} -> get by usuario id (backend: GET /api/pedidos/usuario/{usuarioId})
    // - GET /api/ventas?id=... or ?usuarioId=... -> equivalent to the above via query params

    const params = url.searchParams;
    // Query param overrides
    if (params.has("id")) {
      const id = params.get("id");
      if (!id) {
        return jsonResponse({ error: "ID is required" }, 400);
      }
      const result = await forwardFetch(
        `${API_PREFIX}/${encodeURIComponent(id)}`
      );
      return jsonResponse(result.data, result.status);
    }
    if (params.has("usuarioId")) {
      const usuarioId = params.get("usuarioId");
      if (!usuarioId) {
        return jsonResponse({ error: "Usuario ID is required" }, 400);
      }
      const result = await forwardFetch(
        `${API_PREFIX}/usuario/${encodeURIComponent(usuarioId)}`
      );
      return jsonResponse(result.data, result.status);
    }

    if (after.length === 1) {
      // /api/ventas/{id}
      const id = after[0];
      const result = await forwardFetch(
        `${API_PREFIX}/${encodeURIComponent(id)}`
      );
      return jsonResponse(result.data, result.status);
    } else if (after.length === 2 && after[0] === "usuario") {
      // /api/ventas/usuario/{usuarioId}
      const usuarioId = after[1];
      const result = await forwardFetch(
        `${API_PREFIX}/usuario/${encodeURIComponent(usuarioId)}`
      );
      return jsonResponse(result.data, result.status);
    } else {
      // default: list all
      const result = await forwardFetch(`${API_PREFIX}`);
      return jsonResponse(result.data, result.status);
    }
  } catch (err) {
    console.error("Error in GET /api/ventas:", err);
    return jsonResponse({ error: "Server error" }, 500);
  }
}

export async function POST(req: Request) {
  try {
    // Create pedido: expects the same shape the backend expects (direccion, usuarioId, total, detalles, etc.)
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return jsonResponse({ error: "Invalid body" }, 400);
    }

    // Optionally do light validation so we fail fast locally
    // Backend will perform full validation; we only check minimal required fields
    const missingFields: string[] = [];
    if (body.usuarioId == null) missingFields.push("usuarioId");
    if (!body.direccion) missingFields.push("direccion");
    if (body.total == null) missingFields.push("total");
    if (!Array.isArray(body.detalles) || body.detalles.length === 0)
      missingFields.push("detalles");

    if (missingFields.length > 0) {
      return jsonResponse(
        { error: "Missing or invalid fields", missing: missingFields },
        400
      );
    }

    const result = await forwardFetch(`${API_PREFIX}`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    // Forward backend status and body
    return jsonResponse(result.data, result.status);
  } catch (err) {
    console.error("Error in POST /api/ventas:", err);
    return jsonResponse({ error: "Server error" }, 500);
  }
}

// Support other methods with a 405
export async function PUT() {
  return jsonResponse({ error: "Method Not Allowed" }, 405);
}
export async function DELETE() {
  return jsonResponse({ error: "Method Not Allowed" }, 405);
}
