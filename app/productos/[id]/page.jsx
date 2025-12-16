"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Breadcrumb,
  Badge,
  Form,
} from "react-bootstrap";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { getProductImages } from "../../lib/assetsClient";

/**
 * Cambio principal:
 * - Cuando existe producto.nombre generamos explícitamente las 4 URLs numeradas:
 *   base(1).jpg, base(2).jpg, base(3).jpg, base(4).jpg
 * - Esto garantiza que las 4 miniaturas solicitadas coincidan con el patrón del repo.
 * - Conserva el resto de prioridades (getProductImages, assets, miniaturas) pero si
 *   hay nombre usamos la estrategia numerada para garantizar exactamente 4 urls.
 *
 * No se agregan archivos nuevos. Reinicia dev server tras pegar — rm -rf .next && npm run dev.
 */

const RAW_BASE =
  "https://raw.githubusercontent.com/felipesalazar24/ctrlstore-images/main/products";
const PLACEHOLDER = "/assets/productos/placeholder.png";
const MAX_THUMBS = 4;

function isAbsoluteUrl(s) {
  return /^data:|^https?:\/\//i.test(String(s || ""));
}

function canonicalCategory(cat) {
  if (!cat) return "mouses";
  try {
    const nf = String(cat)
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "");
    const s = nf.toLowerCase().trim();
    const map = {
      monitor: "monitores",
      monitors: "monitores",
      mouse: "mouses",
      mice: "mouses",
      mouses: "mouses",
      teclado: "teclados",
      teclados: "teclados",
      audifono: "audifonos",
      audifonos: "audifonos",
    };
    if (map[s]) return map[s];
    if (!s.endsWith("s")) return `${s}s`;
    return s;
  } catch {
    return "mouses";
  }
}

function makeRawUrlIfNeeded(maybeUrlOrFilename, categoria = "mouses") {
  if (!maybeUrlOrFilename) return null;
  const s = String(maybeUrlOrFilename).trim();
  if (!s) return null;
  if (isAbsoluteUrl(s) || s.startsWith("/")) return s;
  try {
    const catNorm = canonicalCategory(categoria);
    const file = encodeURIComponent(s).replace(/%2F/g, "/");
    return `${RAW_BASE}/${encodeURIComponent(catNorm)}/${file}`.replace(
      /%2F/g,
      "/"
    );
  } catch {
    return s;
  }
}

export default function ProductoDetailPage() {
  // Hooks: orden fijo
  const { addToCart } = useCart();
  const { user } = useAuth();

  const params = useParams();
  const router = useRouter();

  const productIdRaw = params?.id;
  const productId = Number.isNaN(Number(productIdRaw))
    ? productIdRaw
    : Number(productIdRaw);

  const [producto, setProducto] = useState(null);
  const [imagenPrincipal, setImagenPrincipal] = useState("");
  const [cantidad, setCantidad] = useState(1);

  const builtFor = useRef(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (productId == null) {
        if (mounted) setProducto(null);
        return;
      }

      try {
        const res = await fetch(
          `/api/productos?id=${encodeURIComponent(String(productId))}`,
          {
            cache: "no-store",
          }
        );
        if (!res.ok) {
          if (mounted) setProducto(null);
          return;
        }

        const data = await res.json();
        const p = data ?? null;
        if (!mounted) return;

        const normalized = { ...(p || {}) };
        normalized.atributo = normalized.atributo || normalized.categoria || "";

        // Render text asap
        setProducto(normalized);

        const key = String(productId);
        if (p && builtFor.current !== key) {
          builtFor.current = key;

          // 1) Try getProductImages to prefer indexed images (non-blocking)
          let imgsFromLib = [];
          try {
            imgsFromLib = await getProductImages(
              p.nombre || p.id,
              normalized.atributo || "",
              MAX_THUMBS
            );
            if (!Array.isArray(imgsFromLib)) imgsFromLib = [];
          } catch {
            imgsFromLib = [];
          }

          // Build candidate list
          let candidates = [];

          // If product.nombre exists we MUST generate exactly the 4 numbered jpg urls:
          if (normalized.nombre) {
            // use the product name as base, keep spaces and parentheses pattern: "Name(1).jpg"
            const base = String(normalized.nombre).trim();
            for (let i = 1; i <= MAX_THUMBS; i++) {
              candidates.push(`${base}(${i}).jpg`);
            }
          } else {
            // Fallback flow when no nombre: prefer imgsFromLib -> assets -> miniaturas -> imagen -> guesses
            // imgsFromLib
            if (Array.isArray(imgsFromLib) && imgsFromLib.length) {
              candidates.push(...imgsFromLib);
            }
            // backend assets
            if (Array.isArray(normalized.assets) && normalized.assets.length) {
              for (const a of normalized.assets) candidates.push(a);
            }
            // miniaturas
            if (
              Array.isArray(normalized.miniaturas) &&
              normalized.miniaturas.length
            ) {
              for (const m of normalized.miniaturas) candidates.push(m);
            }
            // main image
            if (normalized.imagen) candidates.push(normalized.imagen);
            // if still short, generate numbered png/jpg guesses from imagen/name
            if (candidates.length < MAX_THUMBS) {
              const seeds = [];
              if (normalized.imagen) {
                try {
                  const u = new URL(normalized.imagen);
                  seeds.push(
                    u.pathname
                      .split("/")
                      .pop()
                      .replace(/\.[^.]+$/, "")
                  );
                } catch {
                  seeds.push(String(normalized.imagen).replace(/\.[^.]+$/, ""));
                }
              }
              if (normalized.nombre) seeds.push(String(normalized.nombre));
              for (const s of seeds) {
                for (
                  let i = 1;
                  i <= MAX_THUMBS && candidates.length < MAX_THUMBS;
                  i++
                ) {
                  candidates.push(`${s}(${i}).png`);
                }
              }
            }
          }

          // Normalize candidates to raw URLs (only convert non-absolute entries)
          const urls = [];
          const seen = new Set();
          for (const c of candidates) {
            if (!c) continue;
            let url = c;
            if (!isAbsoluteUrl(c) && !String(c).startsWith("/")) {
              url = makeRawUrlIfNeeded(c, normalized.atributo || "mouses");
            }
            if (!url) continue;
            if (!seen.has(url)) {
              seen.add(url);
              urls.push(url);
            }
            if (urls.length >= MAX_THUMBS) break;
          }

          if (!urls.length) urls.push(PLACEHOLDER);

          if (mounted) {
            setImagenPrincipal(urls[0] || PLACEHOLDER);
            setProducto((prev) => ({ ...(prev || {}), assets: urls }));
            console.debug("[producto_detail] constructed urls:", urls);
          }
        } else {
          // already built: ensure main image
          if (p) {
            const imgs =
              Array.isArray(p.assets) && p.assets.length ? p.assets : [];
            const main = imgs.length
              ? imgs[0]
              : p.imagen
              ? makeRawUrlIfNeeded(p.imagen, normalized.atributo)
              : PLACEHOLDER;
            if (mounted) {
              setImagenPrincipal(main);
              setProducto((prev) => ({ ...(prev || {}), assets: imgs }));
            }
          }
        }
      } catch (err) {
        console.warn("Error fetching product:", err);
        if (mounted) setProducto(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [productId]);

  // stock sync (hooks fixed order)
  const stockNumber =
    Number(
      producto?.stock ??
        producto?.cantidad ??
        producto?.stockDisponible ??
        producto?.stock_total ??
        0
    ) || 0;
  useEffect(() => {
    if (stockNumber > 0) {
      setCantidad((c) => {
        const n = Number(c) || 1;
        return Math.min(Math.max(1, n), stockNumber);
      });
    } else {
      setCantidad(1);
    }
  }, [stockNumber]);

  const safeSrc = (s) => {
    if (!s) return PLACEHOLDER;
    const str = String(s);
    if (str.startsWith("data:")) return str;
    if (str.startsWith("/")) return str;
    if (/^https?:\/\//i.test(str)) return str;
    return (
      makeRawUrlIfNeeded(
        str,
        producto?.atributo || producto?.categoria || "mouses"
      ) || PLACEHOLDER
    );
  };

  const buildThumbs = () => {
    const out = [];
    const push = (v) => {
      if (!v) return;
      const r = safeSrc(v);
      if (!r) return;
      if (!out.includes(r)) out.push(r);
    };

    if (Array.isArray(producto?.assets) && producto.assets.length) {
      for (const a of producto.assets) push(a);
    } else {
      push(producto?.imagen);
      if (Array.isArray(producto?.miniaturas)) {
        for (const m of producto.miniaturas) push(m);
      }
    }

    const mainResolved = safeSrc(imagenPrincipal);
    if (mainResolved) {
      const idx = out.indexOf(mainResolved);
      if (idx > -1) out.splice(idx, 1);
      out.unshift(mainResolved);
    }

    return out.slice(0, MAX_THUMBS);
  };

  const thumbs = buildThumbs();

  if (!producto) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <h2>Producto no encontrado</h2>
          <p>El producto que buscas no existe.</p>
          <Link href="/productos" className="btn btn-primary">
            Volver a Productos
          </Link>
        </div>
      </Container>
    );
  }

  const offerForProduct = producto?.oferta
    ? {
        oldPrice: Number(producto.precio ?? 0),
        percent: Number(producto.oferPorcentaje || 0),
        newPrice: Math.round(
          Number(producto.precio ?? 0) *
            (1 - Number(producto.oferPorcentaje || 0) / 100)
        ),
      }
    : null;

  const originalPrice = Number((producto?.precio ?? producto?.price) || 0);
  const hasOffer = !!(
    offerForProduct &&
    (offerForProduct.newPrice || offerForProduct.percent)
  );
  const effectivePrice = hasOffer
    ? Number(
        offerForProduct.newPrice ??
          Math.round(
            originalPrice * (1 - (Number(offerForProduct.percent) || 0) / 100)
          )
      )
    : originalPrice;
  const percentLabel = hasOffer
    ? offerForProduct.percent ??
      Math.round(
        (((offerForProduct.oldPrice || originalPrice) - effectivePrice) /
          (offerForProduct.oldPrice || originalPrice)) *
          100
      )
    : 0;

  const handleAddToCart = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    const qty = Number(cantidad) || 1;
    if (stockNumber <= 0) {
      alert("No hay stock disponible para este producto.");
      return;
    }
    if (qty > stockNumber) {
      alert(
        `La cantidad solicitada (${qty}) excede el stock disponible (${stockNumber}).`
      );
      return;
    }
    const item = { ...(producto || {}), precio: effectivePrice };
    addToCart(item, Number(qty));
    alert(`¡${producto?.nombre} agregado al carrito!`);
  };

  return (
    <Container className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
        <Breadcrumb.Item href="/productos">Productos</Breadcrumb.Item>
        <Breadcrumb.Item active>{producto.nombre}</Breadcrumb.Item>
      </Breadcrumb>

      <Row>
        <Col md={6}>
          <Card className="p-3">
            <div
              style={{
                width: "100%",
                minHeight: 360,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#fff",
              }}
            >
              <img
                src={safeSrc(imagenPrincipal)}
                alt={producto.nombre}
                style={{ width: "100%", objectFit: "contain", maxHeight: 520 }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = PLACEHOLDER;
                }}
              />
            </div>

            <div className="d-flex gap-2 mt-2 flex-wrap">
              {thumbs.length > 0 ? (
                thumbs.map((m, i) => {
                  const resolved = safeSrc(m);
                  const active =
                    String(resolved) === String(safeSrc(imagenPrincipal));
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setImagenPrincipal(resolved)}
                      style={{
                        border: active ? "2px solid #0d6efd" : "1px solid #ddd",
                        padding: 4,
                        borderRadius: 6,
                        background: "transparent",
                      }}
                    >
                      <img
                        src={resolved}
                        alt={`${producto.nombre}-${i}`}
                        style={{
                          width: 56,
                          height: 56,
                          objectFit: "cover",
                          borderRadius: 4,
                        }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = PLACEHOLDER;
                        }}
                      />
                    </button>
                  );
                })
              ) : (
                <div className="text-muted small">No hay miniaturas</div>
              )}
            </div>
          </Card>
        </Col>

        <Col md={6}>
          <h2>
            {producto.nombre}{" "}
            {hasOffer && (
              <Badge bg="danger" className="ms-2">
                -{percentLabel}%
              </Badge>
            )}
          </h2>
          <Badge bg="secondary" className="mb-2">
            {producto.atributo}
          </Badge>

          <div className="mb-3">
            {hasOffer ? (
              <div>
                <div style={{ fontSize: 20 }}>
                  <span className="text-decoration-line-through text-muted me-2">
                    ${originalPrice.toLocaleString("es-CL")}
                  </span>
                  <span className="text-primary fw-bold">
                    ${Number(effectivePrice).toLocaleString("es-CL")}
                  </span>
                </div>
                <div className="small text-muted">Oferta (server)</div>
              </div>
            ) : (
              <h3 className="text-primary">
                ${originalPrice.toLocaleString("es-CL")}
              </h3>
            )}
          </div>

          <p>{producto.descripcion}</p>

          <div className="mb-2">
            {stockNumber > 0 ? (
              <div>
                <strong>Stock disponible:</strong> {stockNumber}
              </div>
            ) : (
              <div>
                <strong style={{ color: "crimson" }}>Agotado</strong>
              </div>
            )}
          </div>

          <div className="d-flex align-items-center gap-2 mb-3">
            <Form.Control
              type="number"
              min={1}
              max={stockNumber > 0 ? stockNumber : 1}
              value={cantidad}
              onChange={(e) => {
                const v = Number(e.target.value) || 1;
                if (stockNumber > 0)
                  setCantidad(Math.min(Math.max(1, v), stockNumber));
                else setCantidad(1);
              }}
              style={{ width: 100 }}
              disabled={stockNumber <= 0}
            />
            <Button
              variant="primary"
              onClick={handleAddToCart}
              disabled={stockNumber <= 0}
            >
              Agregar al Carrito
            </Button>
            <Link href="/carrito" className="btn btn-outline-secondary">
              Ver Carrito
            </Link>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
