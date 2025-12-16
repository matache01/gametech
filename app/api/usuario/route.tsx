import { NextResponse } from "next/server";

const BACKEND_BASE = "https://backendusuariogametech-production.up.railway.app";

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

    // Try to parse JSON, but fallback to text if no JSON
    let data = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = text;
    }

    return { ok: res.ok, status: res.status, data };
  } catch (error) {
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
      // no dedicated login endpoint: fetch all users and match
      const { ok, status, data } = await proxyFetch(`/api/v1/usuarios`);
      if (!ok) return NextResponse.json({ error: data }, { status });
      if (!Array.isArray(data))
        return NextResponse.json(
          { error: "Unexpected backend response" },
          { status: 502 }
        );

      const found = data.find(
        (u: any) =>
          String(u.email).toLowerCase() === String(email).toLowerCase() &&
          String(u.contrasenia) === String(contrasenia)
      );
      if (!found)
        return NextResponse.json(
          { message: "Invalid credentials" },
          { status: 401 }
        );
      return NextResponse.json(found, { status: 200 });
    }

    const { ok, status, data } = await proxyFetch(`/api/v1/usuarios`);
    if (!ok) return NextResponse.json({ error: data }, { status });
    return NextResponse.json(data, { status });
  } catch (error) {
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
    const body = (await request.json()) || {};

    if (!body.telefono || Number(body.telefono) <= 0) body.telefono = 0;
    if (!body.fechaCreacion) {
      body.fechaCreacion = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    }
    if (!body.rol) body.rol = "cliente";

    const { ok, status, data } = await proxyFetch(`/api/v1/usuarios`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!ok) return NextResponse.json({ error: data }, { status });
    return NextResponse.json(data, { status });
  } catch (error) {
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
    const body = (await request.json()) || {};
    const id = idParam || body.id;

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
  } catch (error) {
    return NextResponse.json(
      { message: "Invalid request body", error: String(error) },
      { status: 400 }
    );
  }
}

/**
 * DELETE -> delete a user by id
 * Important: backend may return 204 No Content. NextResponse.json must NOT be used with 204.
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
      {
        method: "DELETE",
      }
    );

    // If backend returned 204 No Content -> return an empty NextResponse with 204 status
    if (status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    // For other statuses, forward appropriately
    if (!ok) {
      return NextResponse.json({ error: data }, { status });
    }

    return NextResponse.json(data ?? { message: "Deleted" }, { status });
  } catch (error) {
    return NextResponse.json(
      { message: "Server error", error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS -> respond to preflight CORS checks
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
