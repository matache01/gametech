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
// Asumimos que getProductImages es una función que ayuda a encontrar rutas.
// Si no la usas, puedes comentarla o eliminarla.
import { getProductImages } from "../../lib/assetsClient";

/**
 * ProductoDetailPage.js - Código Ajustado
 * * Enfocado en asegurar la generación correcta de URLs de miniaturas
 * para la estructura 'Nombre del Producto(X).jpg' en GitHub.
 */

const RAW_BASE =
  "https://raw.githubusercontent.com/felipesalazar24/ctrlstore-images/main/products";
const PLACEHOLDER = "/assets/productos/placeholder.png";
const MAX_THUMBS = 4;

function isAbsoluteUrl(s) {
  return /^data:|^https?:\/\//i.test(String(s || ""));
}

// Asegura que el nombre de la categoría coincida con el nombre de la carpeta en GitHub.
// Asumo que tus carpetas en GitHub (Teclado, Mouse, etc.) están con la primera letra en mayúscula y singular.
function canonicalCategory(cat) {
  if (!cat) return "Mouse";
  try {
    const nf = String(cat)
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "");

    const s = nf.toLowerCase().trim();

    // Mapeo a singular y capitalizado, asumiendo la estructura de carpetas de tu repositorio
    const map = {
      monitor: "Monitor",
      monitors: "Monitor",
      mouse: "Mouse",
      mice: "Mouse",
      mouses: "Mouse",
      teclado: "Teclado",
      teclados: "Teclado",
      audifono: "Audifono",
      audifonos: "Audifono",
    };
    if (map[s]) return map[s];

    // Fallback: usar el valor tal cual con capitalización si no está mapeado
    const original = String(cat).trim();
    if (!original) return "Mouse";

    return original.charAt(0).toUpperCase() + original.slice(1).toLowerCase();
  } catch {
    return "Mouse";
  }
}

// Función para construir la URL completa de GitHub Raw.
function makeRawUrlIfNeeded(maybeUrlOrFilename, categoria = "Mouse") {
  if (!maybeUrlOrFilename) return null;
  const s = String(maybeUrlOrFilename).trim();
  if (!s) return null;

  if (isAbsoluteUrl(s) || s.startsWith("/")) return s;

  try {
    const catNorm = canonicalCategory(categoria);

    // 1. Codifica la carpeta de la categoría.
    const encodedCat = encodeURIComponent(catNorm);

    // 2. Codifica el nombre del archivo (ej. 'Logitech G502(1).jpg')
    // Esto asegura que los espacios y caracteres especiales se manejen correctamente en la URL.
    const encodedFile = encodeURIComponent(s).replace(/%2F/g, "/");

    return `${RAW_BASE}/${encodedCat}/${encodedFile}`;
  } catch {
    return s;
  }
}

export default function ProductoDetailPage() {
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

          // Construcción de la lista de miniaturas
          let candidates = [];

          // *** Lógica para generar las 4 URLs numeradas ***
          // Esta es la parte crítica que debe coincidir con el primer componente.
          if (normalized.nombre) {
            const base = String(normalized.nombre).trim();
            for (let i = 1; i <= MAX_THUMBS; i++) {
              candidates.push(`${base}(${i}).jpg`);
            }
          }

          // Si no hay nombre (o para llenar vacíos si se necesitan más), usamos fallbacks.
          if (candidates.length < MAX_THUMBS) {
            // Fallback: prefer imgsFromLib -> assets -> miniaturas -> imagen
            let imgsFromLib = [];
            try {
              // Si la función getProductImages existe y funciona:
              imgsFromLib = await getProductImages(
                p.nombre || p.id,
                normalized.atributo || "",
                MAX_THUMBS
              );
              if (!Array.isArray(imgsFromLib)) imgsFromLib = [];
            } catch {
              imgsFromLib = [];
            }
            if (Array.isArray(imgsFromLib) && imgsFromLib.length) {
              candidates.push(...imgsFromLib);
            }
            if (Array.isArray(normalized.assets) && normalized.assets.length) {
              for (const a of normalized.assets) candidates.push(a);
            }
            if (
              Array.isArray(normalized.miniaturas) &&
              normalized.miniaturas.length
            ) {
              for (const m of normalized.miniaturas) candidates.push(m);
            }
            if (normalized.imagen) candidates.push(normalized.imagen);
          }
          // **********************************************

          // Normaliza candidatos a URLs de GitHub Raw
          const urls = [];
          const seen = new Set();
          const categoryForUrl = normalized.atributo || "Mouse"; // Usar la categoría normalizada

          for (const c of candidates) {
            if (!c) continue;
            let url = c;

            // Si NO es una URL absoluta o ruta local, la convertimos a URL de GitHub Raw
            if (!isAbsoluteUrl(c) && !String(c).startsWith("/")) {
              url = makeRawUrlIfNeeded(c, categoryForUrl);
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
            // Almacena las URLs generadas en 'assets' del producto para usarlas en las miniaturas
            setProducto((prev) => ({ ...(prev || {}), assets: urls }));
            console.debug("[producto_detail] constructed urls:", urls);
          }
        } else {
          // Lógica de re-render (ya construido): asegura la imagen principal
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
        producto?.atributo || producto?.categoria || "Mouse" // Usar "Mouse" o el valor que coincida con tu carpeta por defecto
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

    // Usar las URLs construidas y almacenadas en producto.assets
    if (Array.isArray(producto?.assets) && producto.assets.length) {
      for (const a of producto.assets) push(a);
    } else {
      // Fallback si por alguna razón no se construyeron los assets
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
    // Si todavía está cargando y no hay producto, puedes mostrar un spinner.
    // Aquí usamos la comprobación simple de null.
    return (
      <Container className="py-4">
        <div className="text-center">
          <h2>Cargando o Producto no encontrado</h2>
          <p>Por favor, espere o verifique la URL.</p>
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
                // Usa safeSrc para garantizar la URL codificada final
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
