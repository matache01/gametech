"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Badge,
} from "react-bootstrap";
import Link from "next/link";
import { useCart } from "./context/CartContext";
import { getProductImages } from "./lib/assetsClient";

// Componente para imagen con placeholder en caso de error
const ProductImage = (props) => {
  const [imgSrc, setImgSrc] = useState(props.src);

  const handleError = () => {
    setImgSrc(
      "https://via.placeholder.com/300x200/cccccc/969696?text=Imagen+No+Disponible"
    );
  };

  useEffect(() => {
    setImgSrc(props.src);
  }, [props.src]);

  return (
    <Card.Img
      variant="top"
      src={imgSrc}
      alt={props.alt}
      style={props.style}
      onError={handleError}
    />
  );
};

const loadProducts = async () => {
  try {
    const res = await fetch("/api/productos");
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
};

const getOfferForProduct = (product) => {
  if (!product) return null;
  const oferta = !!product.oferta;
  const percent = Number(product.oferPorcentaje || 0) || 0;
  if (!oferta || (percent <= 0 && !product.oferPorcentaje)) return null;
  const oldPrice = Number(product.precio ?? 0) || 0;
  const newPrice = percent
    ? Math.round(oldPrice * (1 - percent / 100))
    : oldPrice;
  return { oldPrice, newPrice, percent, source: "server" };
};

const getEffectivePrice = (product, offer) => {
  const raw = Number(product.precio ?? product.price ?? 0) || 0;
  if (!offer) return { oldPrice: null, price: raw, percent: 0 };
  const oldPrice = Number(offer.oldPrice ?? raw) || raw;
  let price = Number(offer.newPrice ?? 0);
  let percent = Number(offer.percent ?? 0);

  if (!price && percent && oldPrice)
    price = Math.round(oldPrice * (1 - percent / 100));
  if (!percent && price && oldPrice)
    percent = Math.round(((oldPrice - price) / oldPrice) * 100);
  if (!price || price <= 0) price = raw;

  return { oldPrice: oldPrice || null, price, percent: percent || 0 };
};

// Helper para leer respuesta flexible (JSON/text/204)
async function parseResponseSafely(res) {
  if (!res) return null;
  const contentType = res.headers?.get?.("content-type") || "";
  if (res.status === 204) return { ok: true, status: 204, data: null };
  if (contentType.includes("application/json")) {
    try {
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    } catch {
      const txt = await res.text().catch(() => "");
      return { ok: res.ok, status: res.status, data: txt || null };
    }
  } else {
    const txt = await res.text().catch(() => "");
    return { ok: res.ok, status: res.status, data: txt || null };
  }
}

export default function HomePage() {
  const [productos, setProductos] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // imagenes cache/local state para UI (map productId -> { primary, images })
  const [imagesMap, setImagesMap] = useState(new Map());

  const { addToCart } = useCart();

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Cargar productos y ventas (nueva API /api/ventas)
        const [prodData, ventasRes] = await Promise.all([
          loadProducts(),
          fetch(`/api/ventas?ts=${Date.now()}`).catch(() => null),
        ]);

        let ventasData = [];
        if (ventasRes) {
          const parsed = await parseResponseSafely(ventasRes);
          if (
            parsed &&
            (parsed.ok || parsed.status === 200 || parsed.status === 201)
          ) {
            ventasData = Array.isArray(parsed.data)
              ? parsed.data
              : parsed.data?.records ??
                parsed.data?.ventas ??
                parsed.data ??
                [];
            // ensure array
            if (!Array.isArray(ventasData)) ventasData = [];
          } else {
            ventasData = [];
          }
        } else {
          ventasData = [];
        }

        if (!mounted) return;

        setProductos(Array.isArray(prodData) ? prodData : []);
        setSales(Array.isArray(ventasData) ? ventasData : []);

        // fetch images for first 12 candidates (top will be computed later)
        const forProducts = Array.isArray(prodData)
          ? prodData.slice(0, 12)
          : [];
        const promises = forProducts.map(async (p) => {
          const imgs = await getProductImages(
            p.nombre ?? p.title ?? String(p.id ?? p._id),
            p.atributo ?? p.categoria ?? "",
            4
          ).catch(() => []);
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
        setError(err.message || "Error");
        setProductos([]);
        setSales([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4 text-center">
        <h2>Error al cargar productos</h2>
        <p className="text-muted">{error}</p>
      </Container>
    );
  }

  // Construir mapa de ventas: soporta múltiples formas de estructura de la API ventas
  const soldMap = {};
  for (const venta of Array.isArray(sales) ? sales : []) {
    // ventas pueden contener: items, detalles, orderItems, lineItems, productos
    const items =
      venta.items ??
      venta.detalles ??
      venta.lineItems ??
      venta.orderItems ??
      venta.productos ??
      [];
    if (!Array.isArray(items)) continue;
    for (const it of items) {
      // distintos nombres posibles para id y cantidad
      const pid =
        it.productoId ??
        it.productId ??
        it.id ??
        it._id ??
        it.sku ??
        it.codigo ??
        null;
      const qty =
        Number(it.cantidad ?? it.qty ?? it.quantity ?? it.cant ?? 1) || 0;
      const key = String(pid ?? it.nombre ?? JSON.stringify(it));
      soldMap[key] = (soldMap[key] || 0) + qty;
    }
  }

  const productsWithSales = (Array.isArray(productos) ? productos : []).map(
    (p) => {
      const key = String(p.id ?? p._id ?? p.sku ?? p.nombre ?? "");
      const offer = getOfferForProduct(p);
      const ef = getEffectivePrice(p, offer);
      const imgs = imagesMap.get(String(p.id ?? p._id ?? p.nombre)) || [];
      return { ...p, totalSold: soldMap[key] || 0, offer, ef, assets: imgs };
    }
  );

  const top = productsWithSales
    .slice()
    .sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0))
    .slice(0, 8);

  const hasSales = top.some((p) => (p.totalSold || 0) > 0);
  const destacados = hasSales ? top : (productsWithSales || []).slice(0, 8);

  const safeSrc = (s) => {
    if (!s)
      return "https://via.placeholder.com/300x200/cccccc/969696?text=Imagen+No+Disponible";
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

  const primeraFila = destacados.slice(0, 4);
  const segundaFila = destacados.slice(4, 8);

  return (
    <>
      <section
        className="hero-section py-5"
        style={{ background: "#0b1226", color: "#fff" }}
      >
        <Container>
          <Row className="align-items-center min-vh-50">
            <Col lg={6}>
              <h1 className="display-4 fw-bold mb-4">
                Eleva tu Experiencia Gaming
              </h1>
              <p className="lead mb-4">
                Descubre los mejores productos gaming con tecnología de punta.
                Desde mouse de alta precisión hasta teclados mecánicos y
                audífonos inmersivos.
              </p>
              <div className="d-flex gap-3">
                <Link href="/productos" className="btn btn-light btn-lg">
                  Ver Productos
                </Link>
                <Link href="/ofertas" className="btn btn-outline-light btn-lg">
                  Ofertas Especiales
                </Link>
              </div>
            </Col>
            <Col lg={6}>
              <div className="text-center">
                <div className="bg-white rounded p-4 shadow">
                  <h5 className="text-dark">🎮 Productos Destacados</h5>
                  <p className="text-muted">Los más vendidos de la tienda</p>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <Container className="py-5">
        <Row className="text-center mb-3">
          <Col>
            <h2 className="fw-bold">Productos Destacados</h2>
            <p className="text-muted">Los favoritos de nuestros clientes</p>
          </Col>
        </Row>

        <Row className="g-4 mb-4">
          {primeraFila.map((producto) => (
            <Col key={String(producto.id ?? producto.nombre)} sm={6} md={3}>
              <Card className="h-100 shadow-sm border-0">
                <div
                  style={{
                    position: "relative",
                    padding: 12,
                    textAlign: "center",
                  }}
                >
                  {producto.ef && producto.ef.percent ? (
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
                      -{producto.ef.percent}%
                    </Badge>
                  ) : null}
                  <ProductImage
                    src={safeSrc(
                      producto.assets && producto.assets.length
                        ? producto.assets[0]
                        : producto.imagen
                    )}
                    alt={producto.nombre}
                    style={{
                      height: "150px",
                      objectFit: "contain",
                      padding: "15px",
                    }}
                  />
                </div>

                <Card.Body className="text-center">
                  <Card.Title className="h6">{producto.nombre}</Card.Title>

                  <Card.Text className="text-primary fw-bold">
                    {producto.ef && producto.ef.oldPrice ? (
                      <>
                        <span
                          style={{
                            textDecoration: "line-through",
                            color: "#777",
                            marginRight: 8,
                          }}
                        >
                          $
                          {Number(producto.ef.oldPrice).toLocaleString("es-CL")}
                        </span>
                        <span style={{ color: "#0d6efd", fontWeight: 700 }}>
                          ${Number(producto.ef.price).toLocaleString("es-CL")}
                        </span>
                      </>
                    ) : (
                      <>
                        $
                        {typeof producto.precio === "number"
                          ? producto.precio.toLocaleString("es-CL")
                          : producto.precio}
                      </>
                    )}
                  </Card.Text>
                  <div className="d-grid gap-2">
                    <Link
                      href={`/productos/${producto.id}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      Ver Producto
                    </Link>
                    <Button
                      variant="primary"
                      className="btn-sm"
                      onClick={() =>
                        handleAddToCart(
                          producto,
                          producto.ef && producto.ef.price
                            ? producto.ef.price
                            : producto.precio
                        )
                      }
                    >
                      Agregar al Carrito
                    </Button>
                  </div>
                  <div className="mt-2">
                    <small className="text-muted">
                      Vendidos: {producto.totalSold ?? 0}
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <Row className="g-4">
          {segundaFila.map((producto) => (
            <Col key={String(producto.id ?? producto.nombre)} sm={6} md={3}>
              <Card className="h-100 shadow-sm border-0">
                <div
                  style={{
                    position: "relative",
                    padding: 12,
                    textAlign: "center",
                  }}
                >
                  {producto.ef && producto.ef.percent ? (
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
                      -{producto.ef.percent}%
                    </Badge>
                  ) : null}
                  <ProductImage
                    src={safeSrc(
                      producto.assets && producto.assets.length
                        ? producto.assets[0]
                        : producto.imagen
                    )}
                    alt={producto.nombre}
                    style={{
                      height: "150px",
                      objectFit: "contain",
                      padding: "15px",
                    }}
                  />
                </div>

                <Card.Body className="text-center">
                  <Card.Title className="h6">{producto.nombre}</Card.Title>

                  <Card.Text className="text-primary fw-bold">
                    {producto.ef && producto.ef.oldPrice ? (
                      <>
                        <span
                          style={{
                            textDecoration: "line-through",
                            color: "#777",
                            marginRight: 8,
                          }}
                        >
                          $
                          {Number(producto.ef.oldPrice).toLocaleString("es-CL")}
                        </span>
                        <span style={{ color: "#0d6efd", fontWeight: 700 }}>
                          ${Number(producto.ef.price).toLocaleString("es-CL")}
                        </span>
                      </>
                    ) : (
                      <>
                        $
                        {typeof producto.precio === "number"
                          ? producto.precio.toLocaleString("es-CL")
                          : producto.precio}
                      </>
                    )}
                  </Card.Text>
                  <div className="d-grid gap-2">
                    <Link
                      href={`/productos/${producto.id}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      Ver Producto
                    </Link>
                    <Button
                      variant="primary"
                      className="btn-sm"
                      onClick={() =>
                        handleAddToCart(
                          producto,
                          producto.ef && producto.ef.price
                            ? producto.ef.price
                            : producto.precio
                        )
                      }
                    >
                      Agregar al Carrito
                    </Button>
                  </div>
                  <div className="mt-2">
                    <small className="text-muted">
                      Vendidos: {producto.totalSold ?? 0}
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
}
