"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Alert,
  Badge,
  Pagination,
} from "react-bootstrap";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/felipesalazar24/ctrlstore-images/main/products";

const PRODUCT_IMAGES = {
  "Logitech G502": `${GITHUB_RAW_BASE}/Mouse/Logitech G502(1).jpg`,
  "Logitech G305 LightSpeed Wireless": `${GITHUB_RAW_BASE}/Mouse/Logitech G305 LightSpeed Wireless(1).jpg`,
  "Logitech G203 Lightsync Blue": `${GITHUB_RAW_BASE}/Mouse/Logitech G203 Lightsync Blue(1).jpg`,
  "Redragon Kumara K552 Rainbow": `${GITHUB_RAW_BASE}/Teclado/Redragon Kumara K552 Rainbow(1).jpg`,
  "Logitech G PRO X TKL": `${GITHUB_RAW_BASE}/Teclado/Logitech G PRO X TKL(1).jpg`,
  "Razer BlackWidow V4 75% - Black": `${GITHUB_RAW_BASE}/Teclado/Razer BlackWidow V4 75 - Black(1).jpg`,
  "Logitech G435 - Black/Yellow": `${GITHUB_RAW_BASE}/Audifono/Logitech G435 - Black/Yellow(1).jpg`,
  "Razer BlackShark V2 X": `${GITHUB_RAW_BASE}/Audifono/Razer BlackShark V2 X(1).jpg`,
  "Logitech G335 - Black": `${GITHUB_RAW_BASE}/Audifono/Logitech G335 - Black(1).jpg`,
  "Xiaomi A27Qi": `${GITHUB_RAW_BASE}/Monitor/Xiaomi A27Qi(1).jpg`,
  "LG UltraGear 24GS60F-B": `${GITHUB_RAW_BASE}/Monitor/LG UltraGear 24GS60F-B(1).jpg`,
  "Xiaomi G34WQi": `${GITHUB_RAW_BASE}/Monitor/Xiaomi G34WQi(1).jpg`,
};

const getProductImageUrl = (producto) => {
  if (PRODUCT_IMAGES[producto.nombre]) {
    return PRODUCT_IMAGES[producto.nombre];
  }
  return "/assets/productos/placeholder.png";
};

const safeSrc = (s) => {
  if (!s) return "/assets/productos/placeholder.png";
  try {
    if (String(s).startsWith("data:")) return s;
    if (!String(s).match(/^https?:\/\//i) && typeof window !== "undefined") {
      return new URL(s, window.location.origin).href;
    }
    return String(s);
  } catch {
    return String(s);
  }
};

const loadProducts = async () => {
  try {
    const res = await fetch("/api/productos");
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Error al cargar productos");
    }
    const prodData = await res.json().catch(() => []);
    return Array.isArray(prodData) ? prodData : [];
  } catch (err) {
    throw err;
  }
};

export default function ProductosPage() {
  const { user } = useAuth();
  const cart = useCart();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const PAGE_SIZE = 40;
  const [page, setPage] = useState(1);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const prodData = await loadProducts();
        if (!mounted) return;
        setProductos(prodData);
        setPage(1);
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

  const computeOfferFor = (product) => {
    if (!product) return null;
    const oferta = !!product.oferta;
    const percent = Number(product.oferPorcentaje || 0) || 0;
    if (!oferta || percent <= 0) return null;
    const oldPrice = Number(product.precio ?? product.price ?? 0);
    const newPrice = Math.round(oldPrice * (1 - percent / 100));
    return { oldPrice, newPrice, percent, source: "server" };
  };

  const totalPages = Math.max(
    1,
    Math.ceil((productos?.length || 0) / PAGE_SIZE)
  );

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return (productos || []).slice(start, start + PAGE_SIZE);
  }, [productos, page]);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!productos || productos.length === 0) {
    return (
      <Container className="py-5">
        <Alert variant="info">No hay productos para mostrar.</Alert>
      </Container>
    );
  }

  const handleAddToCart = (product, effectivePrice) => {
    try {
      if (cart && typeof cart.addToCart === "function") {
        const item = { ...product, precio: effectivePrice };
        cart.addToCart(item, 1);
        alert(`¡${product.nombre} agregado al carrito!`);
      } else {
        const e = new CustomEvent("add-to-cart", {
          detail: { product, price: effectivePrice, qty: 1 },
        });
        window.dispatchEvent(e);
      }
    } catch (err) {
      console.warn("addToCart error", err);
    }
  };

  return (
    <Container className="py-5">
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mb-3">
          <Pagination>
            <Pagination.First
              onClick={() => setPage(1)}
              disabled={page === 1}
            />
            <Pagination.Prev
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            />
            {[...Array(Math.min(5, totalPages))].map((_, idx) => {
              const pageNum = idx + 1;
              return (
                <Pagination.Item
                  key={pageNum}
                  active={pageNum === page}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Pagination.Item>
              );
            })}
            <Pagination.Next
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            />
            <Pagination.Last
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            />
          </Pagination>
        </div>
      )}

      <Row xs={1} md={3} lg={4} className="g-4">
        {paginatedProducts.map((p) => {
          const offer = computeOfferFor(p);
          const displayPrice = offer
            ? offer.newPrice
            : p.precio ?? p.price ?? 0;

          return (
            <Col key={p.id ?? p._id ?? p.sku}>
              <Card className="h-100 shadow-sm">
                <div style={{ padding: 18, textAlign: "center" }}>
                  <img
                    src={safeSrc(getProductImageUrl(p))}
                    alt={p.nombre}
                    style={{ width: "100%", height: 180, objectFit: "contain" }}
                    onError={(e) => {
                      console.error(`Error cargando: ${e.target.src}`);
                      e.target.src = "/assets/productos/placeholder.png";
                    }}
                  />
                </div>

                <Card.Body className="d-flex flex-column">
                  <div className="mb-2 d-flex justify-content-between align-items-start">
                    <div>
                      <Card.Title style={{ fontSize: 16 }}>
                        {p.nombre}
                      </Card.Title>
                      <small className="text-muted">
                        {p.atributo || p.categoria}
                      </small>
                    </div>

                    {offer ? (
                      <Badge bg="danger" className="text-wrap">
                        -{offer.percent}%
                      </Badge>
                    ) : null}
                  </div>

                  <div className="mb-3">
                    {offer ? (
                      <div>
                        <div>
                          <span
                            style={{
                              textDecoration: "line-through",
                              color: "#777",
                              marginRight: 8,
                            }}
                          >
                            ${Number(offer.oldPrice).toLocaleString("es-CL")}
                          </span>
                          <span style={{ color: "#0d6efd", fontWeight: 700 }}>
                            ${Number(offer.newPrice).toLocaleString("es-CL")}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: "#0d6efd", fontWeight: 700 }}>
                        $
                        {Number(p.precio ?? p.price ?? 0).toLocaleString(
                          "es-CL"
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto d-grid">
                    <Link
                      href={`/productos/${p.id ?? p._id ?? p.sku}`}
                      className="btn btn-outline-dark btn-sm mb-2"
                    >
                      Ver Detalles
                    </Link>
                    <Button
                      variant="primary"
                      onClick={() => handleAddToCart(p, displayPrice)}
                    >
                      Agregar al Carrito
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>
            <Pagination.First
              onClick={() => setPage(1)}
              disabled={page === 1}
            />
            <Pagination.Prev
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            />
            <Pagination.Next
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            />
            <Pagination.Last
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
            />
          </Pagination>
        </div>
      )}
    </Container>
  );
}
