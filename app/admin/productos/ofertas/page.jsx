"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Card,
  Table,
  Button,
  Badge,
  Alert,
  Spinner,
  Modal,
  Form,
} from "react-bootstrap";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";

/**
 * Página administrativa de Ofertas (actualizada para usar /api/productos)
 *
 * - Ahora las ofertas se derivan de los productos (producto.oferta + producto.oferPorcentaje)
 * - Crear/Eliminar ofertas se hace mediante PATCH a /api/productos (body: { id, oferta, oferPorcentaje })
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

export default function AdminOffersPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalProductId, setModalProductId] = useState("");
  const [modalType, setModalType] = useState("percent");
  const [modalValue, setModalValue] = useState("");
  const [modalError, setModalError] = useState(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const isAdmin = useMemo(() => userIsAdmin(user), [user]);

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

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const pRes = await fetch("/api/productos");
        if (!pRes.ok) {
          const data = await pRes.json().catch(() => ({}));
          throw new Error(data.error || "Error al cargar productos");
        }
        const prodData = await pRes.json().catch(() => []);
        if (!mounted) return;
        setProductos(Array.isArray(prodData) ? prodData : []);
      } catch (err) {
        console.error(err);
        if (!mounted) return;
        setError(err.message || "Error al cargar datos");
        setProductos([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // derive ofertas from productos
  const ofertas = useMemo(() => {
    const arr = [];
    for (const p of productos || []) {
      const pid = String(p.id ?? p._id ?? p.sku ?? "");
      const ofertaFlag = !!p.oferta;
      const percent = Number(p.oferPorcentaje || 0) || 0;
      if (!ofertaFlag || percent <= 0) continue;
      arr.push({
        productId: pid,
        product: p,
        oldPrice: Number(p.precio ?? 0),
        newPrice: Math.round(Number(p.precio ?? 0) * (1 - percent / 100)),
        percent,
        source: "server",
        raw: p,
      });
    }
    arr.sort(
      (a, b) =>
        (b.percent || 0) - (a.percent || 0) ||
        (a.newPrice || 0) - (b.newPrice || 0)
    );
    return arr;
  }, [productos]);

  const openCreateModal = () => {
    setModalProductId("");
    setModalType("percent");
    setModalValue("");
    setModalError(null);
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setModalProductId("");
    setModalType("percent");
    setModalValue("");
    setModalError(null);
  };

  const submitCreateOffer = async () => {
    setModalError(null);
    if (!modalProductId) {
      setModalError("Selecciona un producto");
      return;
    }
    const producto = productos.find(
      (p) => String(p.id ?? p._id ?? p.sku) === String(modalProductId)
    );
    if (!producto) {
      setModalError("Producto no válido");
      return;
    }
    const basePrice = Number(producto.precio || 0);
    if (!basePrice || basePrice <= 0) {
      setModalError("El producto no tiene precio válido");
      return;
    }

    const v = Number(modalValue);
    let percent = null;
    let newPrice = null;

    if (modalType === "percent") {
      if (isNaN(v) || v <= 0 || v >= 100) {
        setModalError("Ingresa porcentaje válido (1-99)");
        return;
      }
      percent = Math.round(v);
      newPrice = Math.round(basePrice * (1 - percent / 100));
    } else {
      if (isNaN(v) || v <= 0 || v >= basePrice) {
        setModalError("Ingresa precio válido menor al precio original");
        return;
      }
      newPrice = Math.round(v);
      percent = Math.round(((basePrice - newPrice) / basePrice) * 100);
    }

    const id = String(modalProductId);
    setModalSaving(true);
    try {
      // PATCH to /api/productos with body { id, oferta: true, oferPorcentaje: percent }
      const res = await fetch("/api/productos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, oferta: true, oferPorcentaje: percent }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Error creando oferta");
      }
      // refresh products list
      const refreshed = await fetch("/api/productos").then((r) =>
        r.ok ? r.json() : []
      );
      setProductos(Array.isArray(refreshed) ? refreshed : []);
      setSuccessMsg("Oferta creada correctamente");
      setTimeout(() => setSuccessMsg(null), 3000);
      closeCreateModal();
    } catch (err) {
      console.warn("Error creating offer:", err);
      setModalError(err.message || "No se pudo crear oferta");
    } finally {
      setModalSaving(false);
    }
  };

  const handleDeleteOffer = async (productId) => {
    const pid = String(productId);
    // locally remove immediately for snappiness
    setProductos((prev) =>
      (prev || []).map((p) =>
        String(p.id) === pid ? { ...p, oferta: false, oferPorcentaje: 0 } : p
      )
    );
    try {
      // Patch to set oferta=false
      await fetch("/api/productos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pid, oferta: false, oferPorcentaje: 0 }),
      });
    } catch (err) {
      // ignore
      console.warn("Error removing offer on server:", err);
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
      <Container className="py-5">
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

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h3 className="mb-0">Ofertas (Admin)</h3>
          <small className="text-muted">
            Crear y gestionar ofertas de productos
          </small>
        </div>

        <div className="d-flex gap-2">
          <Link href="/admin" className="btn btn-outline-secondary">
            Volver al panel
          </Link>
          <Link href="/admin/productos" className="btn btn-outline-secondary">
            Volver a Productos
          </Link>
          <Button variant="primary" onClick={openCreateModal}>
            Crear Oferta
          </Button>
        </div>
      </div>

      {successMsg && <Alert variant="success">{successMsg}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="mb-4">
        <Card.Body>
          <h5 className="mb-3">Ofertas activas</h5>

          {loading && (
            <div className="text-center py-4">
              <Spinner animation="border" role="status" />
            </div>
          )}

          {!loading && ofertas.length === 0 && (
            <div className="text-center text-muted py-4">
              No hay ofertas activas.
            </div>
          )}

          {!loading && ofertas.length > 0 && (
            <Table responsive bordered hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Producto</th>
                  <th>Precio original</th>
                  <th>Precio oferta</th>
                  <th>Descuento</th>
                  <th>Fuente</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ofertas.map((o, idx) => (
                  <tr key={String(o.productId)}>
                    <td>{idx + 1}</td>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={
                            o.product.imagen ||
                            "/assets/productos/placeholder.png"
                          }
                          alt={o.product.nombre}
                          style={{
                            width: 56,
                            height: 40,
                            objectFit: "contain",
                          }}
                          onError={(e) =>
                            (e.target.src = "/assets/productos/placeholder.png")
                          }
                        />
                        <div>
                          <div>{o.product.nombre}</div>
                          <small className="text-muted">
                            {o.product.atributo || o.product.categoria}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>${Number(o.oldPrice || 0).toLocaleString("es-CL")}</td>
                    <td>${Number(o.newPrice || 0).toLocaleString("es-CL")}</td>
                    <td>{o.percent ? `-${o.percent}%` : "-"}</td>
                    <td>
                      <Badge bg={o.source === "server" ? "info" : "secondary"}>
                        {o.source}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Link
                          href={`/productos/${o.product.id}`}
                          className="btn btn-outline-dark btn-sm"
                        >
                          Ver
                        </Link>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeleteOffer(o.productId)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Modal Crear Oferta */}
      <Modal show={showCreateModal} onHide={closeCreateModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Crear Oferta</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger">{modalError}</Alert>}

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Producto</Form.Label>
              <Form.Select
                value={modalProductId}
                onChange={(e) => setModalProductId(e.target.value)}
              >
                <option value="">Selecciona un producto</option>
                {productos.map((p) => (
                  <option
                    key={String(p.id ?? p._id ?? p.sku ?? p.nombre)}
                    value={String(p.id ?? p._id ?? p.sku ?? p.nombre)}
                  >
                    {p.nombre} — $
                    {Number(p.precio || 0).toLocaleString("es-CL")}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tipo de oferta</Form.Label>
              <div>
                <Form.Check
                  inline
                  label="Porcentaje (%)"
                  name="tipo"
                  type="radio"
                  id="tipo-percent"
                  checked={modalType === "percent"}
                  onChange={() => setModalType("percent")}
                />
                <Form.Check
                  inline
                  label="Precio fijo"
                  name="tipo"
                  type="radio"
                  id="tipo-price"
                  checked={modalType === "price"}
                  onChange={() => setModalType("price")}
                />
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>
                {modalType === "percent"
                  ? "Porcentaje de descuento (%)"
                  : "Nuevo precio (ej: 19990)"}
              </Form.Label>
              <Form.Control
                value={modalValue}
                onChange={(e) => setModalValue(e.target.value)}
                placeholder={modalType === "percent" ? "10" : "19990"}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={closeCreateModal}
            disabled={modalSaving}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={submitCreateOffer}
            disabled={modalSaving}
          >
            {modalSaving ? "Guardando..." : "Crear Oferta"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
