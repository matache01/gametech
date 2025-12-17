import { NextResponse } from "next/server";

const BACKEND_BASE =
  "https://backendusuariogametech-production-1e43.up.railway.app";

type BackendUser = {
  id?: number | string;
  email?: string;
  contrasenia?: string;
  [key: string]: unknown;
};

/**
 * Helper to proxy requests to the backend API.
 * Returns an object with { ok, status, data }.
 */
async function proxyFetch(path: string, options: RequestInit = {}) {
  const url = `${BACKEND_BASE}${path}`;
  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    let data: unknown = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    return { ok: res.ok, status: res.status, data };
  } catch (error: unknown) {
    return {
      ok: false,
      status: 502,
      data: { message: "Bad gateway", error: String(error) },
    };
  }
}

/**
 * GET handler
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const email = url.searchParams.get("email");
  const contrasenia = url.searchParams.get("contrasenia");

  try {
    if (id) {
      const { ok, status, data } = await proxyFetch(
        `/api/v1/usuarios/id/${encodeURIComponent(id)}`
      );
      if (!ok) return NextResponse.json({ error: data }, { status });
      return NextResponse.json(data, { status });
    }

    if (email && contrasenia) {
      const { ok, status, data } = await proxyFetch(`/api/v1/usuarios`);
      if (!ok) return NextResponse.json({ error: data }, { status });

      if (!Array.isArray(data)) {
        return NextResponse.json(
          { error: "Unexpected backend response" },
          { status: 502 }
        );
      }

      const users = data as BackendUser[];

      const found = users.find(
        (u) =>
          String(u.email ?? "").toLowerCase() === String(email).toLowerCase() &&
          String(u.contrasenia ?? "") === String(contrasenia)
      );

      if (!found) {
        return NextResponse.json(
          { message: "Invalid credentials" },
          { status: 401 }
        );
      }

      return NextResponse.json(found, { status: 200 });
    }

    const { ok, status, data } = await proxyFetch(`/api/v1/usuarios`);
    if (!ok) return NextResponse.json({ error: data }, { status });
    return NextResponse.json(data, { status });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: "Server error", error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST -> create a new user
 */
export async function POST(request: Request) {
  try {
    const body: Record<string, unknown> = await request.json();

    if (!body["telefono"] || Number(body["telefono"]) <= 0)
      body["telefono"] = 0;

    if (!body["fechaCreacion"]) {
      body["fechaCreacion"] = new Date().toISOString().split("T")[0];
    }

    if (!body["rol"]) body["rol"] = "cliente";

    const { ok, status, data } = await proxyFetch(`/api/v1/usuarios`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!ok) return NextResponse.json({ error: data }, { status });
    return NextResponse.json(data, { status });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: "Invalid request body", error: String(error) },
      { status: 400 }
    );
  }
}

/**
 * PUT -> update a user
 */
export async function PUT(request: Request) {
  try {
    const url = new URL(request.url);
    const idParam = url.searchParams.get("id");
    const body: Record<string, unknown> = await request.json();
    const id = idParam || String(body["id"] ?? "");

    if (!id) {
      return NextResponse.json(
        { message: "Missing id parameter for update" },
        { status: 400 }
      );
    }

    const { ok, status, data } = await proxyFetch(
      `/api/v1/usuarios/actualizar/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify(body),
      }
    );

    if (!ok) return NextResponse.json({ error: data }, { status });
    return NextResponse.json(data, { status });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: "Invalid request body", error: String(error) },
      { status: 400 }
    );
  }
}

/**
 * DELETE -> delete a user by id
 */
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Missing id parameter for delete" },
        { status: 400 }
      );
    }

    const { ok, status, data } = await proxyFetch(
      `/api/v1/usuarios/id/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );

    if (status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    if (!ok) {
      return NextResponse.json({ error: data }, { status });
    }

    return NextResponse.json(data ?? { message: "Deleted" }, { status });
  } catch (error: unknown) {
    return NextResponse.json(
      { message: "Server error", error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS -> CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
