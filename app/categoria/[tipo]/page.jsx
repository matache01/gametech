"use client";

import React, { useMemo, useEffect, useState } from "react";
import Link from "next/link";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Breadcrumb,
  Badge,
  Spinner,
} from "react-bootstrap";
import { useParams } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { getProductImages } from "../../lib/assetsClient";

// Configuración visual y textos por categoría
const CATEGORIES = [
  {
    key: "mouse",
    title: "Mouse Gaming",
    description: "Precisión y velocidad para gamers profesionales",
    btnVariant: "primary",
  },
  {
    key: "teclado",
    title: "Teclados Mecánicos",
    description: "Respuesta táctil y durabilidad excepcional",
    btnVariant: "success",
  },
  {
    key: "audifono",
    title: "Audífonos Gaming",
    description: "Sonido envolvente y comodidad para largas sesiones",
    btnVariant: "warning",
  },
  {
    key: "monitor",
    title: "Monitores Gaming",
    description: "Alta tasa de refresco y colores vibrantes",
    btnVariant: "dark",
  },
];

const safeSrc = (s) => {
  if (!s) return "/assets/productos/placeholder.png";
  try {
    const str = String(s);
    if (str.startsWith("data:") || /^https?:\/\//i.test(str)) return str;
    return str;
  } catch {
    return "/assets/productos/placeholder.png";
  }
};

const getOfferForProduct = (product) => {
  if (!product) return null;
  const oferta = !!product.oferta;
  const percent = Number(product.oferPorcentaje || 0) || 0;
  if (!oferta || percent <= 0) return null;
  const oldPrice = Number(product.precio ?? 0);
  const price = Math.round(oldPrice * (1 - percent / 100));
  return { oldPrice: oldPrice || null, price, percent: percent || 0 };
};

// --- added minimal constants for category images (no layout changes) ---
const CATEGORY_PLACEHOLDER = "/assets/category/default.png"; // ensure this exists in public/assets/category

// helper to build default filename: Mouse.png, Teclado.png, Audifono.png, Monitor.png
function defaultCategoryFilename(key) {
  if (!key) return `${key}.png`;
  const k = String(key);
  return `${k.charAt(0).toUpperCase()}${k.slice(1)}.png`;
}
// ---------------------------------------------------------------------

export default function CategoriaPage() {
  const params = useParams();
  const tipoCategoria = params?.tipo ?? "";
  const [productos, setProductos] = useState([]);
  const { addToCart } = useCart();

  const tipoLower = String(tipoCategoria).toLowerCase();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetch("/api/productos").then((r) =>
          r.ok ? r.json() : []
        );
        if (!mounted) return;
        setProductos(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("Error cargando productos por categoría", err);
        if (mounted) setProductos([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // prefetch images for this category's products (first 40)
  const [imagesMap, setImagesMap] = useState(new Map());
  useEffect(() => {
    let mounted = true;
    (async () => {
      const filtered = productos
        .filter(
          (p) =>
            String(p.atributo || p.categoria || "").toLowerCase() === tipoLower
        )
        .slice(0, 40);
      const promises = filtered.map(async (p) => {
        const imgs = await getProductImages(
          p.nombre || p.id,
          p.atributo || p.categoria || "",
          6
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
  }, [productos, tipoLower]);

  const productosCategoria = productos.filter(
    (producto) =>
      String(producto.atributo || producto.categoria || "").toLowerCase() ===
      tipoLower
  );

  const getCategoryVariant = (atributo) => {
    const variants = {
      mouse: "primary",
      teclado: "success",
      audifono: "warning",
      monitor: "info",
    };
    return variants[atributo] || "secondary";
  };

  const categoriaStats = useMemo(() => {
    const map = {};
    for (const cat of CATEGORIES)
      map[cat.key] = { count: 0, image: null, meta: cat };
    for (const p of productos) {
      const key = String(p.atributo || p.categoria || "").toLowerCase();
      if (!map[key]) continue;
      map[key].count += 1;
      if (
        !map[key].image &&
        (p.imagen || (Array.isArray(p.miniaturas) && p.miniaturas[0]))
      ) {
        map[key].image =
          p.imagen || (Array.isArray(p.miniaturas) && p.miniaturas[0]) || null;
      }
    }
    return map;
  }, [productos]);

  const categoriasParaMostrar = CATEGORIES.filter((c) => c.key !== tipoLower);

  const handleAddToCart = (product, price) => {
    try {
      if (addToCart && typeof addToCart === "function") {
        addToCart({ ...product, precio: Number(price) }, 1);
      } else {
        window.dispatchEvent(
          new CustomEvent("add-to-cart", { detail: { product, price, qty: 1 } })
        );
      }
      alert(`¡${product.nombre} agregado al carrito!`);
    } catch (err) {
      console.warn("addToCart error", err);
    }
  };

  return (
    <Container className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
        <Breadcrumb.Item href="/categoria">Categorías</Breadcrumb.Item>
        <Breadcrumb.Item active>{tipoCategoria}</Breadcrumb.Item>
      </Breadcrumb>

      <h2 className="mb-4 text-capitalize">{tipoCategoria}</h2>

      {productosCategoria.length > 0 ? (
        <Row className="g-4">
          {productosCategoria.map((producto) => {
            const imgs =
              imagesMap.get(
                String(producto.id ?? producto._id ?? producto.nombre)
              ) || [];
            const offer = getOfferForProduct(producto);
            const ef = offer
              ? {
                  oldPrice: offer.oldPrice,
                  price: offer.price,
                  percent: offer.percent,
                }
              : null;
            return (
              <Col key={producto.id} md={4} lg={3}>
                <Card className="h-100 shadow-sm">
                  <div
                    style={{
                      position: "relative",
                      padding: 12,
                      textAlign: "center",
                    }}
                  >
                    {ef && ef.percent ? (
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
                        -{ef.percent}%
                      </Badge>
                    ) : null}
                    <Card.Img
                      variant="top"
                      src={safeSrc(imgs.length ? imgs[0] : producto.imagen)}
                      style={{
                        height: 160,
                        objectFit: "contain",
                        padding: 12,
                        background: "#fff",
                      }}
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/300x200/cccccc/969696?text=Imagen";
                      }}
                    />
                  </div>

                  <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="mb-0">{producto.nombre}</h5>
                      <Badge
                        bg={getCategoryVariant(
                          String(
                            producto.atributo || producto.categoria || ""
                          ).toLowerCase()
                        )}
                      >
                        {producto.atributo || producto.categoria}
                      </Badge>
                    </div>

                    <div className="text-primary fw-bold mb-3">
                      {ef && ef.oldPrice ? (
                        <div>
                          <span
                            style={{
                              textDecoration: "line-through",
                              color: "#777",
                              marginRight: 8,
                            }}
                          >
                            ${Number(ef.oldPrice).toLocaleString("es-CL")}
                          </span>
                          <span style={{ color: "#0d6efd", fontWeight: 700 }}>
                            ${Number(ef.price).toLocaleString("es-CL")}
                          </span>
                        </div>
                      ) : (
                        <div style={{ color: "#0d6efd", fontWeight: 700 }}>
                          ${Number(producto.precio).toLocaleString("es-CL")}
                        </div>
                      )}
                    </div>

                    <div className="mt-auto d-grid gap-2">
                      <Link
                        href={`/productos/${producto.id}`}
                        className="btn btn-outline-dark btn-sm"
                      >
                        Ver Detalles
                      </Link>
                      <Button
                        variant="primary"
                        className="btn-sm"
                        onClick={() =>
                          handleAddToCart(
                            producto,
                            ef ? ef.price : producto.precio
                          )
                        }
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
      ) : (
        <Row>
          <Col className="text-center">
            <div className="py-5">
              <h3 className="h4 text-muted">
                No hay productos en esta categoría
              </h3>
              <Link href="/productos" className="btn btn-primary mt-3">
                Ver Todos
              </Link>
            </div>
          </Col>
        </Row>
      )}

      <div className="mt-5">
        <h4 className="mb-3">Explorar categorías</h4>
        <Row className="g-4">
          {categoriasParaMostrar.map((cat) => {
            const stat = categoriaStats[cat.key] || { count: 0, image: null };

            // --- REPLACED: only this img logic changed to use public/assets/category ---
            let imgSrc = CATEGORY_PLACEHOLDER;
            if (stat.image) {
              const s = String(stat.image || "").trim();
              if (!s) imgSrc = CATEGORY_PLACEHOLDER;
              else if (s.startsWith("/") || /^https?:\/\//i.test(s)) imgSrc = s;
              else imgSrc = `/assets/category/${s}`;
            } else {
              const filename = defaultCategoryFilename(cat.key); // e.g. Mouse.png
              imgSrc = `/assets/category/${filename}`;
            }
            // ---------------------------------------------------------------------

            const btnVariant = cat.btnVariant || "secondary";

            return (
              <Col key={cat.key} md={6} lg={3}>
                <Card className="h-100 shadow-sm">
                  <div style={{ position: "relative" }}>
                    <Card.Img
                      variant="top"
                      src={imgSrc}
                      style={{
                        height: 240,
                        objectFit: "contain",
                        padding: 20,
                        background: "#fff",
                      }}
                      onError={(e) => {
                        // robust onError: set fallback once and remove handler to prevent infinite retries
                        const img = e.currentTarget;
                        try {
                          if (img.dataset.fallback !== "1") {
                            img.dataset.fallback = "1";
                            img.onerror = null;
                            img.src = CATEGORY_PLACEHOLDER;
                          } else {
                            img.onerror = null;
                          }
                        } catch {
                          try {
                            img.onerror = null;
                          } catch {}
                        }
                      }}
                    />
                    <Badge
                      bg="primary"
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        zIndex: 5,
                        padding: "6px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                      }}
                    >
                      {stat.count} productos
                    </Badge>
                  </div>

                  <Card.Body className="d-flex flex-column">
                    <h5 className="mb-1 text-center">{cat.title}</h5>
                    <p className="text-muted text-center small mb-3">
                      {cat.description}
                    </p>

                    <div className="mt-auto d-grid">
                      <Link
                        href={`/categoria/${String(cat.key).toLowerCase()}`}
                        className={`btn btn-${btnVariant}`}
                      >
                        Explorar Categoría
                      </Link>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    </Container>
  );
}
