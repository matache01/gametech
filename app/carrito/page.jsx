"use client";

import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Table,
  Spinner,
} from "react-bootstrap";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";
import { tryHeadThenImage } from "../lib/imageUtils";

/**
 * Carrito completo (versión final recomendada)
 *
 * Comportamiento clave:
 * - Espera a isLoaded desde CartContext antes de resolver imágenes (evita "flash" sin items).
 * - Para cada item hace UNA comprobación (single check) a la URL candidata; si falla usa placeholder.
 * - Si item.imagen es URL absoluta o ruta pública (/...) se usa tal cual (comprobación única).
 * - Normaliza categoría mínima (Teclado -> teclados, etc.) para evitar mismatches con folders.
 * - Normaliza filename (quita diacríticos, paréntesis, ampersand -> and, elimina chars problemáticos)
 *   antes de componer la URL al RAW repo.
 * - Usa caches inFlight por key y por URL para evitar duplicados/requests paralelos.
 *
 * Asegúrate:
 * - Existe /assets/productos/placeholder.png en public.
 * - tryHeadThenImage(url, timeout) existe en ../lib/imageUtils y retorna true/false.
 */

const PLACEHOLDER = "/assets/productos/placeholder.png";
const RAW_BASE =
  "https://raw.githubusercontent.com/felipesalazar24/ctrlstore-images/main/products";
const PRIMARY_EXT = "jpg";
const TRY_TIMEOUT_MS = 1500;

function coalesce(...args) {
  for (const a of args) {
    if (a === null || a === undefined) continue;
    if (typeof a === "string") {
      if (a.trim() === "") continue;
      return a;
    }
    return a;
  }
  return "";
}

function makeItemKey(it) {
  return String(coalesce(it?.id, it?.productoId, it?._id, it?.nombre, ""));
}

function encodeFileSegment(s) {
  return encodeURIComponent(String(s || "")).replace(/%2F/g, "/");
}

/* small category normalization map to avoid mismatches with repo folder names */
function normalizeCategory(cat) {
  if (!cat) return "";
  const s = String(cat).trim().toLowerCase();
  const map = {
    teclado: "teclados",
    teclado: "teclados",
    mouse: "mouses",
    mice: "mouses",
    monitor: "monitores",
    monitors: "monitores",
    audifono: "audifonos",
    audífono: "audifonos",
    headphone: "audifonos",
    headphones: "audifonos",
  };
  return map[s] || s;
}

/**
 * Normaliza filename para reducir 404s por caracteres/diacríticos:
 * - elimina diacríticos
 * - quita paréntesis
 * - reemplaza & por 'and'
 * - elimina otros caracteres extraños (permite letras, números, espacios, . _ -)
 * - devuelve string codificado para URL (pero no toca el esquema)
 */
function normalizeFilenameSegment(original) {
  if (!original) return "";
  try {
    let s = String(original).trim();
    // Strip surrounding quotes
    if (
      (s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'"))
    ) {
      s = s.slice(1, -1);
    }
    // Attempt unicode normalization and remove diacritics
    try {
      s = s.normalize("NFKD").replace(/\p{Diacritic}/gu, "");
    } catch {
      // ignore if environment doesn't support \p
    }
    // Replace ampersand
    s = s.replace(/&/g, "and");
    // Remove parentheses
    s = s.replace(/[()]/g, "");
    // Collapse whitespace
    s = s.replace(/\s+/g, " ").trim();
    // Remove problematic characters but keep dot, dash, underscore and spaces
    s = s.replace(/[^a-zA-Z0-9 ._\-]/g, "");
    // Return encoded segment
    return encodeFileSegment(s);
  } catch (err) {
    return encodeFileSegment(original);
  }
}

function hasExtension(name) {
  return /\.[a-z0-9]{2,6}$/i.test(String(name || ""));
}

function buildRawUrl(category, filenameSegment) {
  const catEnc = encodeURIComponent(String(category || "").trim());
  const fileEnc = String(filenameSegment || "").trim();
  if (!catEnc) return `${RAW_BASE}/${fileEnc}`;
  return `${RAW_BASE}/${catEnc}/${fileEnc}`;
}

export default function CarritoPage() {
  const router = useRouter();
  const {
    items = [],
    getCount,
    getTotal,
    removeFromCart,
    updateQuantity,
    clearCart,
    isLoaded,
  } = useCart();

  const count = typeof getCount === "function" ? getCount() : 0;
  const total = typeof getTotal === "function" ? getTotal() : 0;

  const [imagesMap, setImagesMap] = useState({});
  const inFlightByKey = React.useRef(new Map());
  const inFlightByUrl = React.useRef(new Map());

  useEffect(() => {
    // Wait until cart provider finished loading initial data
    if (!isLoaded) return undefined;

    let mounted = true;

    async function resolveSingle(it) {
      const key = makeItemKey(it);
      if (!key) return;

      // already resolved
      if (imagesMap[key]) return;

      if (inFlightByKey.current.has(key)) {
        try {
          await inFlightByKey.current.get(key);
        } catch {}
        return;
      }

      const promise = (async () => {
        try {
          const rawImgToken = coalesce(it?.imagen, it?.image, it?.img);
          const baseName = String(
            coalesce(it?.nombre, it?.title, it?.id, "")
          ).trim();

          // 1) Absolute URL -> check once and use or fallback
          if (rawImgToken && /^https?:\/\//i.test(String(rawImgToken).trim())) {
            const url = String(rawImgToken).trim();
            if (inFlightByUrl.current.has(url)) {
              try {
                await inFlightByUrl.current.get(url);
                if (mounted)
                  setImagesMap((prev) => ({
                    ...prev,
                    [key]: prev[key] || PLACEHOLDER,
                  }));
                return;
              } catch {}
            }
            const checkPromise = (async () => {
              try {
                const ok = await tryHeadThenImage(url, TRY_TIMEOUT_MS);
                const final = ok ? url : PLACEHOLDER;
                if (mounted)
                  setImagesMap((prev) => ({ ...prev, [key]: final }));
              } catch {
                if (mounted)
                  setImagesMap((prev) => ({ ...prev, [key]: PLACEHOLDER }));
              } finally {
                inFlightByUrl.current.delete(url);
              }
            })();
            inFlightByUrl.current.set(url, checkPromise);
            try {
              await checkPromise;
            } catch {}
            return;
          }

          // 2) Leading slash path in public -> check once
          if (rawImgToken && String(rawImgToken).startsWith("/")) {
            const path = String(rawImgToken).trim();
            if (inFlightByUrl.current.has(path)) {
              try {
                await inFlightByUrl.current.get(path);
                if (mounted)
                  setImagesMap((prev) => ({
                    ...prev,
                    [key]: prev[key] || PLACEHOLDER,
                  }));
                return;
              } catch {}
            }
            const checkPromise = (async () => {
              try {
                const ok = await tryHeadThenImage(path, TRY_TIMEOUT_MS);
                const final = ok ? path : PLACEHOLDER;
                if (mounted)
                  setImagesMap((prev) => ({ ...prev, [key]: final }));
              } catch {
                if (mounted)
                  setImagesMap((prev) => ({ ...prev, [key]: PLACEHOLDER }));
              } finally {
                inFlightByUrl.current.delete(path);
              }
            })();
            inFlightByUrl.current.set(path, checkPromise);
            try {
              await checkPromise;
            } catch {}
            return;
          }

          // 3) Build single candidate filename (normalize it)
          let filenameSegment;
          if (rawImgToken && hasExtension(rawImgToken)) {
            // keep extension but normalize name part
            const parts = String(rawImgToken).split(".");
            const ext = parts.pop();
            const nameOnly = parts.join(".");
            filenameSegment = `${decodeURIComponent(
              normalizeFilenameSegment(nameOnly)
            )}.${ext}`;
            // ensure encoded
            filenameSegment = encodeFileSegment(filenameSegment);
          } else if (
            rawImgToken &&
            typeof rawImgToken === "string" &&
            rawImgToken.trim()
          ) {
            // token without ext -> append PRIMARY_EXT and normalize
            const n = normalizeFilenameSegment(rawImgToken.trim());
            filenameSegment = `${n}.${PRIMARY_EXT}`;
          } else {
            // fallback to baseName(1).jpg normalized
            const bn =
              baseName ||
              String(coalesce(it?.id, it?.productoId, it?._id, "")).trim();
            filenameSegment = `${normalizeFilenameSegment(
              bn + "(1)"
            )}.${PRIMARY_EXT}`;
          }

          // normalize category minimal mapping
          const rawCategory = String(
            coalesce(it?.categoria, it?.atributo, "")
          ).trim();
          const category = normalizeCategory(rawCategory);
          const candidate = buildRawUrl(category || "", filenameSegment);

          // If another check is already in flight for this URL, await it
          if (inFlightByUrl.current.has(candidate)) {
            try {
              await inFlightByUrl.current.get(candidate);
              if (mounted)
                setImagesMap((prev) => ({
                  ...prev,
                  [key]: prev[key] || PLACEHOLDER,
                }));
              return;
            } catch {}
          }

          const checkPromise = (async () => {
            try {
              const ok = await tryHeadThenImage(candidate, TRY_TIMEOUT_MS);
              const final = ok ? candidate : PLACEHOLDER;
              if (mounted) setImagesMap((prev) => ({ ...prev, [key]: final }));
            } catch {
              if (mounted)
                setImagesMap((prev) => ({ ...prev, [key]: PLACEHOLDER }));
            } finally {
              inFlightByUrl.current.delete(candidate);
            }
          })();

          inFlightByUrl.current.set(candidate, checkPromise);
          try {
            await checkPromise;
          } catch {}
        } finally {
          inFlightByKey.current.delete(key);
        }
      })();

      inFlightByKey.current.set(key, promise);
      try {
        await promise;
      } catch {}
    }

    async function resolveAll() {
      if (!items || items.length === 0) {
        setImagesMap({});
        return;
      }
      await Promise.all(items.map((it) => resolveSingle(it)));
    }

    resolveAll();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, isLoaded]);

  const srcForItem = (it) => {
    const key = makeItemKey(it);
    return imagesMap[key] || PLACEHOLDER;
  };

  if (!isLoaded) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={10}>
          <h3>
            Carrito ({count} {count === 1 ? "producto" : "productos"})
          </h3>

          {items.length === 0 ? (
            <Card className="mt-3">
              <Card.Body className="text-center">
                <p>El carrito está vacío.</p>
                <Button onClick={() => router.push("/productos")}>
                  Ver Productos
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <>
              <Table responsive bordered hover className="mt-3">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style={{ width: 120 }}>Cantidad</th>
                    <th className="text-end">Precio unitario</th>
                    <th className="text-end">Subtotal</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={makeItemKey(it) || Math.random()}>
                      <td className="align-middle">
                        <div
                          style={{
                            display: "flex",
                            gap: 12,
                            alignItems: "center",
                          }}
                        >
                          <img
                            src={srcForItem(it)}
                            alt={coalesce(it?.nombre, it?.title, "Producto")}
                            style={{
                              width: 64,
                              height: 48,
                              objectFit: "cover",
                              borderRadius: 4,
                            }}
                            onError={(e) => {
                              e.currentTarget.src = PLACEHOLDER;
                              e.currentTarget.onerror = null;
                            }}
                          />
                          <div>{coalesce(it?.nombre, it?.title, "-")}</div>
                        </div>
                      </td>
                      <td className="align-middle text-center">
                        <input
                          type="number"
                          min="1"
                          value={coalesce(
                            it?.cantidad,
                            it?.qty,
                            it?.quantity,
                            0
                          )}
                          onChange={(e) =>
                            updateQuantity(
                              coalesce(it?.id, it?.productoId, it?._id),
                              Number(e.target.value) || 1
                            )
                          }
                          style={{ width: 80 }}
                        />
                      </td>
                      <td className="align-middle text-end">
                        $
                        {Number(
                          coalesce(it?.precio, it?.price, 0)
                        ).toLocaleString("es-CL")}
                      </td>
                      <td className="align-middle text-end">
                        $
                        {(
                          Number(coalesce(it?.precio, it?.price, 0)) *
                          Number(
                            coalesce(it?.cantidad, it?.qty, it?.quantity, 0)
                          )
                        ).toLocaleString("es-CL")}
                      </td>
                      <td className="align-middle">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            removeFromCart(
                              coalesce(it?.id, it?.productoId, it?._id)
                            )
                          }
                        >
                          Eliminar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <Card className="mt-3">
                <Card.Body className="d-flex justify-content-between align-items-center">
                  <div>
                    <Button
                      variant="outline-secondary"
                      onClick={() => clearCart()}
                    >
                      Vaciar carrito
                    </Button>
                  </div>
                  <div className="text-end">
                    <div>Total</div>
                    <div className="h4">
                      ${Number(total).toLocaleString("es-CL")}
                    </div>
                    <div className="mt-2">
                      <Button
                        variant="success"
                        onClick={() => router.push("/checkout")}
                      >
                        Pagar
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
}
