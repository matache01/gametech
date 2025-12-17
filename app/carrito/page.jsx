"use client";

import React, { useEffect, useState, useRef } from "react";
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

/* ======================================================================
   CONFIG
====================================================================== */

const RAW_BASE =
  "https://raw.githubusercontent.com/felipesalazar24/ctrlstore-images/main/products";

const PLACEHOLDER = "/assets/productos/placeholder.png";
const TRY_TIMEOUT_MS = 1500;

/* ======================================================================
   HELPERS (MISMA LÓGICA QUE PRODUCT DETAIL)
====================================================================== */

function canonicalCategory(cat) {
  if (!cat) return "Mouse";

  const s = String(cat)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  const map = {
    mouse: "Mouse",
    mice: "Mouse",
    teclado: "Teclado",
    teclados: "Teclado",
    audifono: "Audifono",
    audifonos: "Audifono",
    monitor: "Monitor",
    monitores: "Monitor",
  };

  return map[s] || "Mouse";
}

function makeRawUrl(filename, categoria) {
  if (!filename) return null;
  if (/^https?:\/\//i.test(filename)) return filename;

  const cat = canonicalCategory(categoria);
  const encodedFile = encodeURIComponent(filename).replace(/%2F/g, "/");

  return `${RAW_BASE}/${cat}/${encodedFile}`;
}

function makeItemKey(it) {
  return String(it?.id ?? it?.productoId ?? it?._id ?? it?.nombre ?? "");
}

/* ======================================================================
   COMPONENT
====================================================================== */

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
  const inFlight = useRef(new Map());

  /* ======================================================================
     RESOLVER IMÁGENES (SOLO CUANDO CAMBIAN LOS ITEMS)
  ====================================================================== */

  useEffect(() => {
    if (!isLoaded) return;

    // 🟢 Si el carrito queda vacío, limpiar UNA VEZ
    if (!items.length) {
      setImagesMap({});
      return;
    }

    let mounted = true;

    async function resolveItem(it) {
      const key = makeItemKey(it);
      if (!key || imagesMap[key]) return;

      if (inFlight.current.has(key)) {
        await inFlight.current.get(key);
        return;
      }

      const promise = (async () => {
        const nombre = String(it?.nombre || "").trim();
        const categoria = it?.atributo || it?.categoria || "Mouse";

        let finalUrl = PLACEHOLDER;

        for (let i = 1; i <= 4; i++) {
          const filename = `${nombre}(${i}).jpg`;
          const url = makeRawUrl(filename, categoria);

          const ok = await tryHeadThenImage(url, TRY_TIMEOUT_MS);
          if (ok) {
            finalUrl = url;
            break;
          }
        }

        if (mounted) {
          setImagesMap((prev) => ({
            ...prev,
            [key]: finalUrl,
          }));
        }
      })();

      inFlight.current.set(key, promise);
      await promise;
      inFlight.current.delete(key);
    }

    items.forEach((it) => resolveItem(it));

    return () => {
      mounted = false;
    };
    // ❗ imagesMap NO va aquí
  }, [items, isLoaded]);

  const srcForItem = (it) => imagesMap[makeItemKey(it)] || PLACEHOLDER;

  /* ======================================================================
     RENDER
  ====================================================================== */

  if (!isLoaded) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" />
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
                <tbody>
                  {items.map((it) => (
                    <tr key={makeItemKey(it)}>
                      <td>
                        <div className="d-flex gap-3 align-items-center">
                          <img
                            src={srcForItem(it)}
                            alt={it.nombre}
                            style={{
                              width: 64,
                              height: 48,
                              objectFit: "cover",
                            }}
                          />
                          <div>{it.nombre}</div>
                        </div>
                      </td>
                      <td className="text-end">
                        ${Number(it.precio).toLocaleString("es-CL")}
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => removeFromCart(it.id ?? it._id)}
                        >
                          Eliminar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <div className="text-end">
                <h4>Total: ${Number(total).toLocaleString("es-CL")}</h4>
                <Button onClick={() => router.push("/checkout")}>Pagar</Button>
              </div>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
}
