"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Breadcrumb,
  Badge,
} from "react-bootstrap";
import { useParams } from "next/navigation";
import { useCart } from "../../context/CartContext";

/* ============================================================================
   CONFIG IMÁGENES GITHUB RAW (MISMA IDEA QUE DETAIL, PERO MÁS ROBUSTA)
============================================================================ */

const RAW_BASE =
  "https://raw.githubusercontent.com/felipesalazar24/ctrlstore-images/main/products";

const PLACEHOLDER = "/assets/productos/placeholder.png";

function isAbsoluteUrl(s) {
  return /^data:|^https?:\/\//i.test(String(s || ""));
}

function canonicalCategory(cat) {
  if (!cat) return "Mouse";

  const clean = String(cat)
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

  return map[clean] || "Mouse";
}

function makeRawUrl(filename, categoria) {
  if (!filename) return null;
  if (isAbsoluteUrl(filename)) return filename;

  const cat = canonicalCategory(categoria);
  const encodedCat = encodeURIComponent(cat);
  const encodedFile = encodeURIComponent(String(filename)).replace(/%2F/g, "/");

  return `${RAW_BASE}/${encodedCat}/${encodedFile}`;
}

/**
 * Genera variantes del nombre para “calzar” con GitHub:
 * - con % y sin %
 * - doble espacios
 * - con y sin espacio antes de (1)
 */
function buildNameVariants(baseName) {
  const base = String(baseName || "").trim();
  if (!base) return [];

  const variants = new Set();

  // original
  variants.add(base);

  // sin %
  variants.add(base.replaceAll("%", ""));

  // por si queda “75  -”
  variants.add(
    base
      .replaceAll("%", "")
      .replace(/\s{2,}/g, " ")
      .trim()
  );

  // por si el % está pegado a número: "75% -"
  variants.add(base.replace(/(\d)\%/g, "$1"));

  // normalizar espacios
  variants.add(base.replace(/\s{2,}/g, " ").trim());

  // sin % + normalizado
  variants.add(
    base
      .replaceAll("%", "")
      .replace(/\s{2,}/g, " ")
      .trim()
  );

  return Array.from(variants).filter(Boolean);
}

function buildCandidatesForProduct(producto, max = 4) {
  const categoria = producto?.atributo || producto?.categoria || "Mouse";
  const nameVariants = buildNameVariants(producto?.nombre);

  const files = [];

  for (const name of nameVariants) {
    for (let i = 1; i <= max; i++) {
      // sin espacio antes del paréntesis
      files.push(`${name}(${i}).jpg`);
      // con espacio antes del paréntesis (a veces pasa)
      files.push(`${name} (${i}).jpg`);
    }
  }

  // convierto a URL raw
  const urls = [];
  const seen = new Set();
  for (const f of files) {
    const u = makeRawUrl(f, categoria);
    if (u && !seen.has(u)) {
      seen.add(u);
      urls.push(u);
    }
  }

  return urls;
}

/* ============================================================================
   COMPONENTE
============================================================================ */

export default function CategoriaPage() {
  const params = useParams();
  const tipoCategoria = params?.tipo ?? "";
  const tipoLower = String(tipoCategoria).toLowerCase();

  const [productos, setProductos] = useState([]);
  const [imagesMap, setImagesMap] = useState(new Map());
  const { addToCart } = useCart();

  // Cargar productos
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch("/api/productos");
        const data = res.ok ? await res.json() : [];
        if (mounted) setProductos(Array.isArray(data) ? data : []);
      } catch {
        if (mounted) setProductos([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Construir lista de urls candidatas por producto
  useEffect(() => {
    const map = new Map();

    const filtered = (productos || []).filter(
      (p) => String(p.atributo || p.categoria || "").toLowerCase() === tipoLower
    );

    for (const p of filtered) {
      const key = String(p.id ?? p._id ?? p.nombre);
      const urls = buildCandidatesForProduct(p, 4);
      map.set(key, urls);
    }

    setImagesMap(map);
  }, [productos, tipoLower]);

  const productosCategoria = (productos || []).filter(
    (p) => String(p.atributo || p.categoria || "").toLowerCase() === tipoLower
  );

  const getCategoryVariant = (atributo) => {
    const map = {
      mouse: "primary",
      teclado: "success",
      audifono: "warning",
      monitor: "info",
    };
    return map[String(atributo || "").toLowerCase()] || "secondary";
  };

  const handleAddToCart = (product) => {
    addToCart({ ...product, precio: Number(product.precio) }, 1);
    alert(`¡${product.nombre} agregado al carrito!`);
  };

  return (
    <Container className="py-4">
      <Breadcrumb>
        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
        <Breadcrumb.Item href="/categoria">Categorías</Breadcrumb.Item>
        <Breadcrumb.Item active>{tipoCategoria}</Breadcrumb.Item>
      </Breadcrumb>

      <h2 className="mb-4 text-capitalize">{tipoCategoria}</h2>

      <Row className="g-4">
        {productosCategoria.map((producto) => {
          const key = String(producto.id ?? producto._id ?? producto.nombre);
          const candidates = imagesMap.get(key) || [];
          const first = candidates[0] || PLACEHOLDER;

          return (
            <Col key={key} md={4} lg={3}>
              <Card className="h-100 shadow-sm">
                <div style={{ padding: 12, textAlign: "center" }}>
                  <Card.Img
                    variant="top"
                    src={first}
                    data-idx="0"
                    style={{
                      height: 160,
                      objectFit: "contain",
                      padding: 12,
                      background: "#fff",
                    }}
                    onError={(e) => {
                      const img = e.currentTarget;
                      const idx = Number(img.dataset.idx || "0");
                      const next = candidates[idx + 1];

                      if (next) {
                        img.dataset.idx = String(idx + 1);
                        img.src = next;
                        return;
                      }

                      img.onerror = null;
                      img.src = PLACEHOLDER;
                    }}
                  />
                </div>

                <Card.Body className="d-flex flex-column">
                  <div className="d-flex justify-content-between mb-2">
                    <h6 className="mb-0">{producto.nombre}</h6>
                    <Badge bg={getCategoryVariant(producto.atributo)}>
                      {producto.atributo || producto.categoria}
                    </Badge>
                  </div>

                  <div className="text-primary fw-bold mb-3">
                    ${Number(producto.precio).toLocaleString("es-CL")}
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
                      size="sm"
                      onClick={() => handleAddToCart(producto)}
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
    </Container>
  );
}
