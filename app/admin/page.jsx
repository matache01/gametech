"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import { useAuth } from "../context/AuthContext";

/**
 * Admin Dashboard page
 * - Aplica la misma verificación de acceso que admin/productos/ofertas/page.jsx:
 *   * spinner mientras auth se hidrata (user === undefined)
 *   * si user === null espera un breve timeout antes de redirigir al login
 *   * si existe user pero no es admin muestra el mensaje exacto de "Acceso denegado"
 *
 * El botón ahora envía al Home (app/page.jsx) en lugar de "Volver al panel".
 */

function userIsAdmin(user) {
  if (!user) return false;
  if (user.isAdmin === true) return true;
  if (user.admin === true) return true;
  const role = (user.role || user.rol || user.roleName || "")
    .toString()
    .toLowerCase();
  if (role === "admin" || role === "administrator") return true;
  if (
    Array.isArray(user.roles) &&
    user.roles.some((r) => String(r).toLowerCase() === "admin")
  )
    return true;
  if (
    Array.isArray(user.permissions) &&
    (user.permissions.includes("admin") || user.permissions.includes("ADMIN"))
  )
    return true;
  const nameCheck = (user.name || user.nombre || user.displayName || "")
    .toString()
    .toLowerCase();
  if (nameCheck.includes("admin")) return true;
  return false;
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = useMemo(() => userIsAdmin(user), [user]);

  // If user === null (not logged) wait a short timeout before redirecting to avoid false redirects
  useEffect(() => {
    let t;
    if (user === null) {
      t = setTimeout(() => {
        router.push("/login");
      }, 1200);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [user, router]);

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
        <Alert variant="warning">
          Comprobando sesión... serás redirigido al login si no hay sesión.
        </Alert>
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="mb-3">
          Acceso denegado. Necesitas permisos de administrador para ver esta
          página.
        </Alert>

        <div>
          <Link href="/" className="btn btn-secondary">
            Volver al inicio
          </Link>
        </div>
      </Container>
    );
  }

  // Admin dashboard UI
  return (
    <Container className="py-5">
      <h2 className="mb-4">Panel de Administración</h2>

      <Row className="g-4">
        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <h5>Productos</h5>
              <p className="text-muted">Crear y gestionar productos</p>
              <div className="d-flex gap-2">
                <Link
                  href="/admin/productos"
                  className="btn btn-outline-primary"
                >
                  Ver Productos
                </Link>
                <Link href="/admin/productos/crear" className="btn btn-primary">
                  Crear Producto
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <h5>Ofertas</h5>
              <p className="text-muted">Administrar ofertas</p>
              <div className="d-flex gap-2">
                <Link
                  href="/admin/productos/ofertas"
                  className="btn btn-primary"
                >
                  Gestionar Ofertas
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="h-100">
            <Card.Body>
              <h5>Usuarios</h5>
              <p className="text-muted">Ver y administrar usuarios</p>
              <div className="d-flex gap-2">
                <Link
                  href="/admin/usuarios"
                  className="btn btn-outline-primary"
                >
                  Ver Usuarios
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
