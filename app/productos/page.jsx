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
import { getProductImages } from "../lib/assetsClient";

function normalizeId(v) {
  return String(v ?? "").trim();
}

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

  // pagination state
  const PAGE_SIZE = 40;
  const [page, setPage] = useState(1);

  // images state map id->images
  const [imagesMap, setImagesMap] = useState(new Map());

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

        // prefetch images for first page
        const pageItems = prodData.slice(0, PAGE_SIZE);
        const promises = pageItems.map(async (p) => {
          const imgs = await getProductImages(
            p.nombre || p.nombre || p.id,
            p.atributo || p.categoria || "",
            4
          );
          return [String(p.id ?? p._id ?? p.nombre), imgs];
        });
        const results = await Promise.all(promises);
        if (!mounted) return;
        setImagesMap((prev) => {
          const map = new Map(prev);
          for (const [k, imgs] of results) map.set(k, imgs);
          return map;
        });
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
  }, [totalPages]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return (productos || []).slice(start, start + PAGE_SIZE);
  }, [productos, page]);

  // when page changes, ensure we have images for displayed items
  useEffect(() => {
    let mounted = true;
    (async () => {
      const toLoad = paginatedProducts.filter(
        (p) => !imagesMap.has(String(p.id ?? p._id ?? p.nombre))
      );
      if (!toLoad.length) return;
      const promises = toLoad.map(async (p) => {
        const imgs = await getProductImages(
          p.nombre || p.nombre || p.id,
          p.atributo || p.categoria || "",
          4
        );
        return [String(p.id ?? p._id ?? p.nombre), imgs];
      });
      const results = await Promise.all(promises);
      if (!mounted) return;
      setImagesMap((prev) => {
        const map = new Map(prev);
        for (const [k, imgs] of results) map.set(k, imgs);
        return map;
      });
    })();
    return () => {
      mounted = false;
    };
  }, [paginatedProducts]);

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
          <Pagination>...</Pagination>
        </div>
      )}

      <Row xs={1} md={3} lg={4} className="g-4">
        {paginatedProducts.map((p) => {
          const offer = computeOfferFor(p);
          const displayPrice = offer
            ? offer.newPrice
            : p.precio ?? p.price ?? 0;
          const imgs = imagesMap.get(String(p.id ?? p._id ?? p.nombre)) || [];
          return (
            <Col key={p.id ?? p._id ?? p.sku}>
              <Card className="h-100 shadow-sm">
                <div style={{ padding: 18, textAlign: "center" }}>
                  <img
                    src={safeSrc(
                      imgs.length
                        ? imgs[0]
                        : p.imagen || "/assets/productos/placeholder.png"
                    )}
                    alt={p.nombre}
                    style={{ width: "100%", height: 180, objectFit: "contain" }}
                    onError={(e) =>
                      (e.target.src = "/assets/productos/placeholder.png")
                    }
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
          <Pagination>...</Pagination>
        </div>
      )}
    </Container>
  );
}
