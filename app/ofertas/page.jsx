"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { getProductImages } from "../lib/assetsClient";

function normalizeId(v) {
  return String(v ?? "").trim();
}

export default function OfertasPage() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // map id->images
  const [imagesMap, setImagesMap] = useState(new Map());

  const { addToCart } = useCart();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [pRes] = await Promise.all([fetch("/api/productos")]);
        if (!pRes.ok) {
          const data = await pRes.json().catch(() => ({}));
          throw new Error(data.error || "Error al cargar productos");
        }
        const prodData = await pRes.json().catch(() => []);
        if (!mounted) return;
        setProductos(Array.isArray(prodData) ? prodData : []);

        // fetch images for all products with offers (limit)
        const offerItems = (prodData || [])
          .filter((p) => !!p.oferta)
          .slice(0, 60);
        const promises = offerItems.map(async (p) => {
          const imgs = await getProductImages(
            p.nombre || p.id,
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

  const ofertas = useMemo(() => {
    const arr = [];
    for (const prod of productos || []) {
      const ofertaFlag = !!prod.oferta;
      const percent = Number(prod.oferPorcentaje || 0) || 0;
      const oldPrice = Number(prod.precio ?? 0) || 0;
      if (!ofertaFlag || percent <= 0) continue;
      const newPrice = Math.round(oldPrice * (1 - percent / 100));
      arr.push({
        productId: String(prod.id ?? prod._id ?? ""),
        product: prod,
        oldPrice,
        newPrice,
        percent,
        source: "server",
      });
    }
    arr.sort(
      (a, b) =>
        (b.percent || 0) - (a.percent || 0) ||
        (a.newPrice || 0) - (b.newPrice || 0)
    );
    return arr;
  }, [productos]);

  const safeSrc = (s) => {
    if (!s) return "/assets/productos/placeholder.png";
    try {
      const str = String(s);
      if (str.startsWith("data:")) return str;
      if (typeof window !== "undefined" && !/^https?:\/\//i.test(str))
        return new URL(str, window.location.origin).href;
      return str;
    } catch {
      return String(s);
    }
  };

  const handleAddToCart = (product, price) => {
    try {
      if (addToCart && typeof addToCart === "function") {
        addToCart({ ...product, precio: Number(price) }, 1);
        alert(`¡${product.nombre} agregado al carrito!`);
      } else {
        window.dispatchEvent(
          new CustomEvent("add-to-cart", { detail: { product, price, qty: 1 } })
        );
      }
    } catch (err) {
      console.warn("addToCart error", err);
    }
  };

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">Ofertas</h3>
        <small className="text-muted">Productos con descuentos</small>
      </div>

      {loading && (
        <div className="text-center py-4">
          <Spinner animation="border" role="status" />
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && ofertas.length === 0 && (
        <Alert variant="info">No hay ofertas activas.</Alert>
      )}

      {!loading && ofertas.length > 0 && (
        <Row xs={1} md={2} lg={4} className="g-4">
          {ofertas.map((o) => {
            const imgs =
              imagesMap.get(
                String(o.product.id ?? o.product._id ?? o.product.nombre)
              ) || [];
            return (
              <Col key={o.productId}>
                <Card className="h-100 shadow-sm border-0 product-card">
                  <div
                    className="position-relative"
                    style={{ padding: 18, textAlign: "center" }}
                  >
                    {o.percent ? (
                      <Badge
                        bg="danger"
                        className="position-absolute"
                        style={{
                          right: 12,
                          top: 12,
                          borderRadius: 6,
                          padding: "6px 8px",
                          fontSize: 12,
                        }}
                      >
                        -{o.percent}%
                      </Badge>
                    ) : null}
                    <img
                      src={safeSrc(
                        imgs.length
                          ? imgs[0]
                          : o.product.imagen ||
                              "/assets/productos/placeholder.png"
                      )}
                      alt={o.product.nombre}
                      style={{
                        width: "100%",
                        height: 160,
                        objectFit: "contain",
                      }}
                      onError={(e) =>
                        (e.target.src = "/assets/productos/placeholder.png")
                      }
                    />
                  </div>

                  <Card.Body className="d-flex flex-column">
                    <Card.Title className="h6 mb-2">
                      <Link
                        href={`/productos/${o.product.id}`}
                        className="text-dark text-decoration-none"
                      >
                        {o.product.nombre}
                      </Link>
                    </Card.Title>

                    <small className="text-muted mb-2">
                      {o.product.atributo || o.product.categoria}
                    </small>

                    <div className="mb-3">
                      <div>
                        <span
                          style={{
                            textDecoration: "line-through",
                            color: "#777",
                            marginRight: 8,
                          }}
                        >
                          ${Number(o.oldPrice || 0).toLocaleString("es-CL")}
                        </span>
                        <span style={{ color: "#0d6efd", fontWeight: 700 }}>
                          ${Number(o.newPrice || 0).toLocaleString("es-CL")}
                        </span>
                      </div>
                    </div>

                    <div className="mt-auto d-grid">
                      <Link
                        href={`/productos/${o.product.id}`}
                        className="btn btn-outline-dark btn-sm mb-2"
                      >
                        Ver Detalles
                      </Link>
                      <Button
                        variant="primary"
                        onClick={() => handleAddToCart(o.product, o.newPrice)}
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
      )}
    </Container>
  );
}
