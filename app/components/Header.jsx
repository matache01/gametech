"use client";

import React, { useEffect, useMemo, useCallback, useState } from "react";
import { Navbar, Nav, Container, Badge, Dropdown } from "react-bootstrap";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

/**
 * Header sin campo de búsqueda (reemplaza app/components/Header.jsx)
 * - Mantiene badge del carrito y menú de usuario/admin
 * - Compatible con AuthContext y CartContext existentes
 */

export default function HeaderComponent() {
  const pathname = usePathname();
  const router = useRouter();
  const cart = useCart();
  const auth = useAuth();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const user = auth?.user ?? null;
  const logout = typeof auth?.logout === "function" ? auth.logout : null;

  // Badge count: usar getCount() si existe, fallback a getTotalItems()
  const itemsCount = useMemo(() => {
    if (!mounted) return 0;
    try {
      if (typeof cart?.getCount === "function")
        return Number(cart.getCount()) || 0;
      if (typeof cart?.getTotalItems === "function")
        return Number(cart.getTotalItems()) || 0;
      return 0;
    } catch (e) {
      console.error("Cart count error", e);
      return 0;
    }
  }, [cart, mounted, cart?.items]);

  const handleLogout = useCallback(async () => {
    try {
      if (logout) await logout();
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      router.push("/");
    }
  }, [logout, router]);

  return (
    <Navbar
      bg="dark"
      variant="dark"
      expand="lg"
      sticky="top"
      className="custom-navbar"
    >
      <Container>
        <Link href="/" className="navbar-brand fw-bold brand-logo">
          🎮 GameTech
        </Link>

        <Navbar.Toggle aria-controls="main-nav" />

        <Navbar.Collapse id="main-nav">
          <Nav className="me-auto">
            <Link
              href="/"
              className={`nav-link-custom ${pathname === "/" ? "active" : ""}`}
            >
              Home
            </Link>
            <Link
              href="/productos"
              className={`nav-link-custom ${
                pathname === "/productos" ? "active" : ""
              }`}
            >
              Productos
            </Link>
            <Link
              href="/categoria"
              className={`nav-link-custom ${
                pathname?.includes("/categoria") ? "active" : ""
              }`}
            >
              Categorías
            </Link>
            <Link
              href="/ofertas"
              className={`nav-link-custom ${
                pathname === "/ofertas" ? "active" : ""
              }`}
            >
              Ofertas
            </Link>
            <Link
              href="/nosotros"
              className={`nav-link-custom ${
                pathname === "/nosotros" ? "active" : ""
              }`}
            >
              Nosotros
            </Link>
            <Link
              href="/blog"
              className={`nav-link-custom ${
                pathname === "/blog" ? "active" : ""
              }`}
            >
              Blog
            </Link>
            <Link
              href="/contacto"
              className={`nav-link-custom ${
                pathname === "/contacto" ? "active" : ""
              }`}
            >
              Contacto
            </Link>
          </Nav>

          <Nav className="ms-auto d-flex align-items-center header-actions">
            {mounted && user ? (
              <Dropdown align="end" className="me-2">
                <Dropdown.Toggle
                  variant="outline-light"
                  id="dropdown-user"
                  className="d-flex align-items-center"
                >
                  👤 <span className="ms-1">{user.nombre ?? user.email}</span>
                  {(user.rol === "admin" || user.isAdmin) && (
                    <Badge bg="warning" text="dark" className="ms-2">
                      Admin
                    </Badge>
                  )}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.ItemText>
                    <small>
                      Conectado como{" "}
                      <strong>{user.nombre ?? user.email}</strong>
                    </small>
                  </Dropdown.ItemText>

                  <Dropdown.Item as="div">
                    <Link href="/perfil" className="dropdown-item">
                      Mi perfil
                    </Link>
                  </Dropdown.Item>

                  <Dropdown.Item as="div">
                    <Link
                      href={user.rol === "admin" ? "/admin" : "/mis-pedidos"}
                      className="dropdown-item"
                    >
                      {user.rol === "admin" ? "Panel Admin" : "Mis pedidos"}
                    </Link>
                  </Dropdown.Item>

                  {user.rol === "admin" && (
                    <>
                      <Dropdown.Divider />
                      <Dropdown.Item as="div">
                        <Link href="/admin/ventas" className="dropdown-item">
                          Ver Ventas
                        </Link>
                      </Dropdown.Item>
                    </>
                  )}

                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout}>
                    🚪 Cerrar sesión
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            ) : (
              <>
                <Link
                  href="/login"
                  className="btn btn-outline-light btn-sm me-2 login-btn"
                >
                  Login
                </Link>
                <Link
                  href="/registro"
                  className="btn btn-primary btn-sm me-3 register-btn"
                >
                  Registro
                </Link>
              </>
            )}

            <Link
              href="/carrito"
              className="btn btn-outline-warning btn-sm cart-btn position-relative"
            >
              🛒
              <span className="ms-1">Carrito</span>
              {itemsCount > 0 && (
                <Badge bg="light" text="dark" className="cart-badge ms-2">
                  {itemsCount}
                </Badge>
              )}
            </Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
