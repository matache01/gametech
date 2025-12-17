import { NextResponse } from "next/server";

/**
 * API unificada de productos (tipada)
 * Proxy hacia: https://backendinventariogametech1-production.up.railway.app
 * Soporta GET (lista, por id, por categoria), POST, PUT, DELETE, PATCH (oferta)
 */

const BACKEND_BASE =
  "https://backendinventariogametech1-production-541c.up.railway.app";
const DEFAULT_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface Producto {
  id?: number;
  nombre?: string;
  precio?: number;
  descripcion?: string;
  stock?: number;
  categoria?: string;
  atributo?: string;
  oferta?: boolean;
  oferPorcentaje?: number;
  imagen?: string;
  miniaturas?: string[];
  [k: string]: unknown;
}

async function proxyToBackend(
  method: string,
  path: string,
  body?: unknown,
  extraHeaders?: Record<string, string>
) {
  const headers: Record<string, string> = {
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...(extraHeaders || {}),
  };

  const res = await fetch(`${BACKEND_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const contentType = res.headers.get("content-type") || "";

  const responseHeaders: Record<string, string> = {
    ...DEFAULT_HEADERS,
    ...(contentType ? { "Content-Type": contentType } : {}),
  };

  if (res.status === 204) {
    return new NextResponse(null, { status: 204, headers: responseHeaders });
  }

  if (contentType.includes("application/json")) {
    try {
      const json = JSON.parse(text || "{}");
      return NextResponse.json(json, {
        status: res.status,
        headers: responseHeaders,
      });
    } catch {
      return new NextResponse(text, {
        status: res.status,
        headers: responseHeaders,
      });
    }
  }

  return new NextResponse(text, {
    status: res.status,
    headers: responseHeaders,
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: DEFAULT_HEADERS });
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams;
    const id = search.get("id");
    const categoria = search.get("categoria");

    if (id) {
      return await proxyToBackend(
        "GET",
        `/api/productos/id/${encodeURIComponent(id)}`
      );
    }

    if (categoria) {
      return await proxyToBackend(
        "GET",
        `/api/productos/categoria/${encodeURIComponent(categoria)}`
      );
    }

    return await proxyToBackend("GET", `/api/productos`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { message: "Error proxying GET to backend", error: message },
      { status: 500, headers: DEFAULT_HEADERS }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Producto;

    if (
      !body ||
      typeof body.nombre !== "string" ||
      !body.nombre.trim() ||
      typeof body.precio !== "number" ||
      body.precio <= 0 ||
      typeof body.descripcion !== "string" ||
      !body.descripcion.trim() ||
      typeof body.categoria !== "string" ||
      !body.categoria.trim()
    ) {
      return NextResponse.json(
        {
          message:
            "Invalid product payload. Required: nombre, precio>0, descripcion, categoria.",
        },
        { status: 400, headers: DEFAULT_HEADERS }
      );
    }

    return await proxyToBackend("POST", `/api/productos`, body);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { message: "Error proxying POST to backend", error: message },
      { status: 500, headers: DEFAULT_HEADERS }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    const body = (await req.json()) as Partial<Producto>;

    const resolvedId =
      id || (typeof body?.id !== "undefined" ? String(body.id) : null);
    if (!resolvedId) {
      return NextResponse.json(
        {
          message:
            "Missing product id. Provide ?id= or include { id } in body.",
        },
        { status: 400, headers: DEFAULT_HEADERS }
      );
    }

    return await proxyToBackend(
      "PUT",
      `/api/productos/actualizar/${encodeURIComponent(String(resolvedId))}`,
      body
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { message: "Error proxying PUT to backend", error: message },
      { status: 500, headers: DEFAULT_HEADERS }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    let resolvedId = url.searchParams.get("id");

    if (!resolvedId) {
      try {
        const body = (await req.json()) as { id?: number | string } | null;
        if (body?.id) resolvedId = String(body.id);
      } catch {
        // ignore parse errors
      }
    }

    if (!resolvedId) {
      return NextResponse.json(
        {
          message:
            "Missing product id. Provide ?id= or include { id } in body.",
        },
        { status: 400, headers: DEFAULT_HEADERS }
      );
    }

    return await proxyToBackend(
      "DELETE",
      `/api/productos/id/${encodeURIComponent(resolvedId)}`
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { message: "Error proxying DELETE to backend", error: message },
      { status: 500, headers: DEFAULT_HEADERS }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = (await req.json()) as {
      id?: number | string;
      oferta?: boolean;
      oferPorcentaje?: number;
    } | null;

    const id = body?.id;
    const oferta = body?.oferta;
    let oferPorcentaje = body?.oferPorcentaje ?? 0;

    if (typeof id === "undefined") {
      return NextResponse.json(
        { message: "Missing product id in PATCH body." },
        { status: 400, headers: DEFAULT_HEADERS }
      );
    }
    if (typeof oferta !== "boolean") {
      return NextResponse.json(
        { message: "Missing or invalid 'oferta' boolean in PATCH body." },
        { status: 400, headers: DEFAULT_HEADERS }
      );
    }
    if (typeof oferPorcentaje !== "number") {
      const parsed = Number(oferPorcentaje);
      oferPorcentaje = Number.isNaN(parsed) ? 0 : parsed;
    }

    const path = `/api/productos/${encodeURIComponent(
      String(id)
    )}/oferta?oferta=${encodeURIComponent(
      String(oferta)
    )}&oferPorcentaje=${encodeURIComponent(String(oferPorcentaje))}`;

    return await proxyToBackend("PATCH", path);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { message: "Error proxying PATCH to backend", error: message },
      { status: 500, headers: DEFAULT_HEADERS }
    );
  }
}
