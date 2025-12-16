"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Spinner,
  Alert,
  Modal,
  Badge,
} from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";

/**
 * Admin Productos (adaptado para usar la nueva API /api/productos)
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

/* ---------- Helpers para ofertas ahora derivados desde producto ---------- */
const getOfferForProduct = (product) => {
  if (!product) return null;
  const oferta = !!product.oferta;
  const percent = Number(product.oferPorcentaje || 0) || 0;
  if (!oferta || percent <= 0) return null;
  const oldPrice = Number(product.precio ?? 0) || 0;
  const newPrice = Math.round(oldPrice * (1 - percent / 100));
  return { oldPrice, price: newPrice, percent, source: "server" };
};
/* --------------------------------------------------- */

export default function AdminProductosPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // While auth may still be hydrating, avoid redirecting immediately.
  useEffect(() => {
    if (typeof user === "undefined") return;
    if (user === null) {
      const t = setTimeout(() => {
        router.push("/login");
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const resProd = await fetch("/api/productos");
        if (!resProd.ok) {
          const data = await resProd.json().catch(() => ({}));
          throw new Error(data.error || "Error al obtener productos");
        }
        const dataProd = await resProd.json().catch(() => []);
        if (!mounted) return;
        setProductos(Array.isArray(dataProd) ? dataProd : []);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Error desconocido");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este producto? Esta acción no se puede deshacer."))
      return;
    try {
      setDeletingId(id);
      // Usar el endpoint unificado: DELETE /api/productos?id=ID
      const res = await fetch(
        `/api/productos?id=${encodeURIComponent(String(id))}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al eliminar producto");
      }
      setProductos((prev) => prev.filter((p) => String(p.id) !== String(id)));
    } catch (err) {
      alert(err.message || "No se pudo eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  const openDetail = (p) => {
    setDetailProduct(p);
    const main =
      p.imagen ||
      (Array.isArray(p.miniaturas) && p.miniaturas.length
        ? p.miniaturas[0]
        : null);
    setSelectedImage(main);
    setShowDetail(true);
  };

  const closeDetail = () => {
    setShowDetail(false);
    setDetailProduct(null);
    setSelectedImage(null);
  };

  const isAdmin = useMemo(() => userIsAdmin(user), [user]);

  // While auth is loading: spinner
  if (typeof user === "undefined") {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    );
  }

  // If not logged (transient): show a message while the redirect (scheduled) happens
  if (user === null) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="warning">
          Comprobando sesión... serás redirigido al login si no hay sesión.
        </Alert>
      </Container>
    );
  }

  // If logged but not admin: show unified access denied UI
  if (!isAdmin) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="mb-3">
          Acceso denegado. Necesitas permisos de administrador para ver esta
          página.
        </Alert>

        <div>
          <a href="/" className="btn btn-secondary">
            Volver al inicio
          </a>
        </div>
      </Container>
    );
  }

  // Admin UI
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={12}>
          <Card className="shadow border-0">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="mb-0">Productos</h3>
                <div>
                  <Button
                    variant="outline-primary"
                    href="/admin"
                    className="me-2"
                  >
                    Volver al panel
                  </Button>

                  <Button
                    variant="info"
                    href="/admin/productos/ofertas"
                    className="me-2"
                  >
                    Gestionar Ofertas
                  </Button>

                  <Button variant="primary" href="/admin/productos/crear">
                    Crear Producto
                  </Button>
                </div>
              </div>

              {loading && (
                <div className="text-center py-4">
                  <Spinner animation="border" role="status" />
                </div>
              )}

              {error && <Alert variant="danger">{error}</Alert>}

              {!loading && !error && productos.length === 0 && (
                <Alert variant="info">No hay productos registrados.</Alert>
              )}

              {!loading && !error && productos.length > 0 && (
                <Table bordered hover responsive>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th style={{ minWidth: 90 }}>Imagen</th>
                      <th>Nombre</th>
                      <th>Categoría</th>
                      <th>Precio</th>
                      <th>Stock</th>
                      <th className="text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((p, idx) => {
                      const offer = getOfferForProduct(p);
                      const ef = offer;
                      return (
                        <tr key={p.id ?? p._id ?? idx}>
                          <td style={{ width: 40 }}>{idx + 1}</td>
                          <td style={{ width: 90 }}>
                            {p.imagen ? (
                              <img
                                src={p.imagen}
                                alt={p.nombre}
                                style={{
                                  width: 64,
                                  height: 64,
                                  objectFit: "cover",
                                  borderRadius: 6,
                                  background: "#f5f5f5",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 64,
                                  height: 64,
                                  background: "#f5f5f5",
                                  borderRadius: 6,
                                }}
                              />
                            )}
                          </td>
                          <td>{p.nombre || "-"}</td>
                          <td>{p.atributo || p.categoria || "-"}</td>

                          {/* Precio: mostrar precio original (tachado) y debajo el precio de oferta + badge */}
                          <td>
                            {ef && ef.oldPrice ? (
                              <div>
                                <div>
                                  <span
                                    style={{
                                      textDecoration: "line-through",
                                      color: "#777",
                                    }}
                                  >
                                    ${" "}
                                    {Number(ef.oldPrice).toLocaleString(
                                      "es-CL"
                                    )}
                                  </span>
                                </div>
                                <div className="d-flex align-items-center mt-1">
                                  <div
                                    style={{
                                      color: "#0d6efd",
                                      fontWeight: 700,
                                      marginRight: 8,
                                    }}
                                  >
                                    ${Number(ef.price).toLocaleString("es-CL")}
                                  </div>
                                  {ef.percent ? (
                                    <Badge bg="danger">-{ef.percent}%</Badge>
                                  ) : null}
                                </div>
                              </div>
                            ) : (
                              <div>
                                {typeof p.precio !== "undefined"
                                  ? `$ ${p.precio}`
                                  : "-"}
                              </div>
                            )}
                          </td>

                          <td>
                            {typeof p.stock !== "undefined" ? p.stock : "-"}
                          </td>
                          <td className="text-center">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              className="me-2"
                              onClick={() => openDetail(p)}
                            >
                              Ver
                            </Button>

                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(p.id)}
                              disabled={deletingId === p.id}
                            >
                              {deletingId === p.id ? "Eliminando…" : "Eliminar"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}

              <Modal show={showDetail} onHide={closeDetail} centered size="lg">
                <Modal.Header closeButton>
                  <Modal.Title>Detalle del producto</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  {detailProduct ? (
                    <Row>
                      <Col
                        md={5}
                        className="d-flex flex-column align-items-center"
                      >
                        {selectedImage ? (
                          <img
                            src={selectedImage}
                            alt={detailProduct.nombre}
                            style={{
                              width: "100%",
                              maxHeight: 360,
                              objectFit: "contain",
                              background: "#fff",
                              borderRadius: 6,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: 360,
                              background: "#f5f5f5",
                              borderRadius: 6,
                            }}
                          />
                        )}

                        <div className="d-flex gap-2 mt-3 flex-wrap justify-content-center">
                          {detailProduct.imagen && (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedImage(detailProduct.imagen)
                              }
                              className="border-0 p-0"
                              style={{ background: "transparent" }}
                            >
                              <img
                                src={detailProduct.imagen}
                                alt="mini"
                                style={{
                                  width: 64,
                                  height: 64,
                                  objectFit: "cover",
                                  border:
                                    selectedImage === detailProduct.imagen
                                      ? "2px solid #0d6efd"
                                      : "1px solid #ddd",
                                  borderRadius: 6,
                                }}
                              />
                            </button>
                          )}

                          {Array.isArray(detailProduct.miniaturas) &&
                            detailProduct.miniaturas.map((m, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setSelectedImage(m)}
                                className="border-0 p-0"
                                style={{ background: "transparent" }}
                              >
                                <img
                                  src={m}
                                  alt={`mini-${i}`}
                                  style={{
                                    width: 64,
                                    height: 64,
                                    objectFit: "cover",
                                    border:
                                      selectedImage === m
                                        ? "2px solid #0d6efd"
                                        : "1px solid #ddd",
                                    borderRadius: 6,
                                  }}
                                />
                              </button>
                            ))}
                        </div>
                      </Col>

                      <Col md={7}>
                        <h5>{detailProduct.nombre || "-"}</h5>
                        <p>
                          <strong>Categoría:</strong>{" "}
                          {detailProduct.atributo ||
                            detailProduct.categoria ||
                            "-"}
                        </p>

                        {/* Precio en modal: mostrar tachado + oferta si existe */}
                        <p>
                          <strong>Precio:</strong>{" "}
                          {(() => {
                            const offer = getOfferForProduct(detailProduct);
                            if (offer && offer.oldPrice) {
                              return (
                                <>
                                  <span
                                    style={{
                                      textDecoration: "line-through",
                                      color: "#777",
                                      marginRight: 8,
                                    }}
                                  >
                                    $
                                    {Number(offer.oldPrice).toLocaleString(
                                      "es-CL"
                                    )}
                                  </span>
                                  <span
                                    style={{
                                      color: "#0d6efd",
                                      fontWeight: 700,
                                    }}
                                  >
                                    $
                                    {Number(offer.price).toLocaleString(
                                      "es-CL"
                                    )}
                                  </span>
                                  {offer.percent ? (
                                    <Badge bg="danger" className="ms-2">
                                      -{offer.percent}%
                                    </Badge>
                                  ) : null}
                                </>
                              );
                            }
                            return typeof detailProduct.precio !== "undefined"
                              ? `$ ${detailProduct.precio}`
                              : "-";
                          })()}
                        </p>

                        <p>
                          <strong>Stock:</strong>{" "}
                          {typeof detailProduct.stock !== "undefined"
                            ? detailProduct.stock
                            : "-"}
                        </p>

                        <p>
                          <strong>Descripción:</strong>
                        </p>
                        <p>{detailProduct.descripcion || "-"}</p>
                        <p className="small text-muted">
                          ID: {detailProduct.id}
                        </p>
                      </Col>
                    </Row>
                  ) : (
                    <div>Cargando...</div>
                  )}
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="secondary" onClick={closeDetail}>
                    Cerrar
                  </Button>
                </Modal.Footer>
              </Modal>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
