"use client";

import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import Link from "next/link";

/**
 * Categories index (fixed images in public/assets/category)
 *
 * - Robust onError to avoid infinite image retry loops.
 * - Restored the bottom "¿No encuentras lo que buscas?" banner with buttons.
 */

const CATEGORIES = [
  {
    key: "mouse",
    title: "Mouse Gaming",
    description: "Precisión y velocidad",
    btnVariant: "primary",
  },
  {
    key: "teclado",
    title: "Teclados Mecánicos",
    description: "Respuesta táctil y durabilidad",
    btnVariant: "success",
  },
  {
    key: "audifono",
    title: "Audífonos Gaming",
    description: "Sonido envolvente y comodidad",
    btnVariant: "warning",
  },
  {
    key: "monitor",
    title: "Monitores Gaming",
    description: "Alta tasa de refresco y colores",
    btnVariant: "dark",
  },
];

// Map category key -> filename in public/assets/category/
const IMAGE_MAP = {
  mouse: "Mouse.png",
  teclado: "Teclado.png",
  audifono: "Audifono.png",
  monitor: "Monitor.png",
};

const PLACEHOLDER = "/assets/category/default.png"; // <-- ensure this file exists in public/assets/category/

export default function CategoriaIndexPage() {
  return (
    <Container className="py-4">
      <div className="text-center mb-4">
        <h1 className="display-5 fw-bold">Categorías</h1>
        <p className="text-muted">Explora por tipo de producto</p>
      </div>

      <Row className="g-4">
        {CATEGORIES.map((cat) => {
          const filename = IMAGE_MAP[cat.key] || null;
          const imgSrc = filename
            ? `/assets/category/${filename}`
            : PLACEHOLDER;

          return (
            <Col key={cat.key} md={6} lg={3}>
              <Card className="h-100 shadow-sm">
                <div
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    background: "#fff",
                  }}
                >
                  <img
                    src={imgSrc}
                    alt={cat.title}
                    style={{ width: "100%", height: 240, objectFit: "cover" }}
                    onError={(e) => {
                      // Robust onError: set fallback once and remove handler to avoid infinite retries.
                      const img = e.currentTarget;
                      try {
                        if (img.dataset.fallback !== "1") {
                          img.dataset.fallback = "1";
                          img.onerror = null; // stop further onerror events for this element
                          img.src = PLACEHOLDER;
                        } else {
                          // already tried fallback; disable further handling
                          img.onerror = null;
                        }
                      } catch {
                        try {
                          img.onerror = null;
                        } catch {}
                      }
                    }}
                  />
                </div>

                <Card.Body className="d-flex flex-column">
                  <h5 className="mb-1 text-center">{cat.title}</h5>
                  <p className="text-muted text-center small mb-3">
                    {cat.description}
                  </p>

                  <div className="mt-auto d-grid">
                    <Link
                      href={`/categoria/${encodeURIComponent(cat.key)}`}
                      className={`btn btn-${cat.btnVariant}`}
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

      {/* Información adicional — restaurada */}
      <Row className="mt-5">
        <Col className="text-center">
          <div className="bg-light rounded p-4">
            <h3 className="h4 mb-3">¿No encuentras lo que buscas?</h3>
            <p className="text-muted mb-3">
              Explora todos nuestros productos o contáctanos para asistencia
              personalizada
            </p>
            <div className="d-flex gap-3 justify-content-center">
              <Link href="/productos" className="btn btn-primary">
                Ver Todos los Productos
              </Link>
              <Link href="/contacto" className="btn btn-outline-secondary">
                Contactar Soporte
              </Link>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
