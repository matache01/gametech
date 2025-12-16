"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container, Table, Spinner, Alert, Button } from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";

/**
 * Admin Usuarios page
 * - Verifica acceso de administrador
 * - Lista usuarios desde la nueva API unificada /api/usuario
 * - Reemplaza el botón "Ver" por "Eliminar" y solo permite eliminar usuarios con rol "cliente"
 * - Manejo robusto de respuestas DELETE (204 No Content, 200 JSON, errores HTML, etc.)
 */

function userIsAdmin(user) {
  if (!user) return false;
  if (user.isAdmin === true) return true;
  if (user.admin === true) return true;
  const role = (user.role || user.rol || user.roleName || "").toString().toLowerCase();
  if (role === "admin" || role === "administrator") return true;
  if (Array.isArray(user.roles) && user.roles.some((r) => String(r).toLowerCase() === "admin")) return true;
  if (Array.isArray(user.permissions) && (user.permissions.includes("admin") || user.permissions.includes("ADMIN"))) return true;
  const nameCheck = (user.name || user.nombre || user.displayName || "").toString().toLowerCase();
  if (nameCheck.includes("admin")) return true;
  return false;
}

export default function AdminUsuariosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = useMemo(() => userIsAdmin(user), [user]);

  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Delay redirect if unauthenticated to avoid false redirects while auth hydrates
  useEffect(() => {
    let t;
    if (user === null) {
      t = setTimeout(() => router.push("/login"), 1200);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/usuario"); // <-- nueva ruta unificada
        if (!res.ok) {
          // intentar leer JSON si viene, si no, texto
          const contentType = res.headers.get("content-type") || "";
          const body = contentType.includes("application/json")
            ? await res.json().catch(() => null)
            : await res.text().catch(() => null);
          throw new Error((body && (body.error || body.message)) || `Error al cargar usuarios (${res.status})`);
        }
        // parsear solo si viene JSON
        const contentType = res.headers.get("content-type") || "";
        const data = contentType.includes("application/json")
          ? await res.json().catch(() => [])
          : [];
        if (!mounted) return;
        setUsuarios(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError(err.message || "Error desconocido");
        setUsuarios([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  // Helper para procesar respuestas del servidor de forma segura
  const parseResponseSafely = async (res) => {
    const contentType = res.headers.get("content-type") || "";
    if (res.status === 204) {
      // No content -> éxito
      return { ok: true, status: 204, data: null };
    }
    if (contentType.includes("application/json")) {
      try {
        const data = await res.json();
        return { ok: res.ok, status: res.status, data };
      } catch (err) {
        const txt = await res.text().catch(() => "");
        return { ok: res.ok, status: res.status, data: txt || null };
      }
    } else {
      // No es JSON (posible HTML de error), devolver texto
      const text = await res.text().catch(() => "");
      return { ok: res.ok, status: res.status, data: text || null };
    }
  };

  // Handler para eliminar usuario (solo clientes)
  const handleDelete = async (u) => {
    const id = u.id ?? u._id;
    const rol = (u.rol || u.role || "").toString().toLowerCase();

    if (!id) {
      setError("No se pudo determinar el id del usuario.");
      return;
    }

    if (rol !== "cliente") {
      setError("Solo se pueden eliminar usuarios con rol 'cliente'.");
      return;
    }

    const confirmed = confirm(`¿Estás seguro de eliminar al usuario "${u.nombre || u.email}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError(null);
      setSuccessMessage(null);

      const res = await fetch(`/api/usuario?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const parsed = await parseResponseSafely(res);

      if (!parsed.ok) {
        const msg =
          (parsed.data && typeof parsed.data === "object" && (parsed.data.error || parsed.data.message)) ||
          (typeof parsed.data === "string" ? parsed.data : null) ||
          `Error al eliminar (status ${parsed.status})`;
        throw new Error(msg);
      }

      // Si llegamos aquí, eliminación exitosa (204 o 200)
      setUsuarios((prev) => prev.filter((x) => String(x.id ?? x._id) !== String(id)));
      setSuccessMessage("Usuario eliminado correctamente.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error("Eliminar usuario error:", err);
      setError(err.message || "Error al eliminar usuario.");
    } finally {
      setDeletingId(null);
    }
  };

  if (typeof user === "undefined") {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    );
  }

  if (user === null) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="warning">Comprobando sesión... serás redirigido al login si no hay sesión.</Alert>
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="mb-3">
          Acceso denegado. Necesitas permisos de administrador para ver esta página.
        </Alert>
        <div>
          <Link href="/" className="btn btn-secondary">Volver al inicio</Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Usuarios</h3>
        <div className="d-flex gap-2">
          <Link href="/admin" className="btn btn-outline-secondary">Volver al panel</Link>
          <Button variant="primary" href="/admin/usuarios/crear">Crear Usuario</Button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-4">
          <Spinner animation="border" role="status" />
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {!loading && !error && usuarios.length === 0 && (
        <Alert variant="info">No hay usuarios registrados.</Alert>
      )}

      {!loading && !error && usuarios.length > 0 && (
        <Table responsive bordered hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u, i) => {
              const id = u.id ?? u._id ?? i;
              const rol = (u.rol || u.role || "").toString().toLowerCase();
              const canDelete = rol === "cliente";
              return (
                <tr key={id}>
                  <td>{i + 1}</td>
                  <td>{u.nombre || u.name || "-"}</td>
                  <td>{u.email || "-"}</td>
                  <td>{u.rol || u.role || "-"}</td>
                  <td>
                    <div className="d-flex gap-2">
                      {canDelete ? (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(u)}
                          disabled={deletingId && String(deletingId) === String(id)}
                        >
                          {deletingId && String(deletingId) === String(id) ? "Eliminando..." : "Eliminar"}
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" disabled>
                          No permitido
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
    </Container>
  );
}