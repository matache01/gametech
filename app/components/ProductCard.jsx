// Nuevo componente ProductCard (uso mínimo)
// - Pide la imagen primaria en modo quick para evitar probes pesados en listados.
// - Muestra un placeholder visual (skeleton) mientras resuelve la URL.
// - Monta <img> sólo cuando la url está lista (evita colocar placeholder que dispare requests).
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button, Spinner } from "react-bootstrap";
import { getPrimaryImage } from "../lib/assetsClient";

export default function ProductCard({ producto }) {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setSrc(null);

    // quick: true pide la URL codificada del primer candidato sin verificar (rápido)
    getPrimaryImage(
      producto.nombre || producto.id,
      producto.atributo || producto.categoria || "",
      { quick: true }
    )
      .then((u) => {
        if (!mounted) return;
        if (u) setSrc(u);
      })
      .catch(() => {
        // keep src null -> show skeleton
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [producto]);

  const imgStyle = {
    width: "100%",
    height: 180,
    objectFit: "contain",
    background: "#fff",
  };

  return (
    <Card className="mb-3">
      <div
        style={{
          height: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fff",
        }}
      >
        {loading ? (
          <div style={{ width: "100%", textAlign: "center", padding: 24 }}>
            <Spinner
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
            />
          </div>
        ) : src ? (
          <img
            src={src}
            alt={producto.nombre}
            style={imgStyle}
            loading="lazy"
            decoding="async"
          />
        ) : (
          // si no hay src, muestra placeholder estático (no dispara probes adicionales)
          <img
            src="/assets/productos/placeholder.png"
            alt="placeholder"
            style={imgStyle}
          />
        )}
      </div>

      <Card.Body>
        <Card.Title style={{ fontSize: 16 }}>{producto.nombre}</Card.Title>
        <Card.Text className="text-muted" style={{ fontSize: 13 }}>
          {producto.atributo}
        </Card.Text>
        <div className="d-flex gap-2">
          <Link
            href={`/productos/${producto.id}`}
            className="btn btn-outline-primary btn-sm"
          >
            Ver Detalles
          </Link>
          <Button variant="primary" size="sm">
            Agregar al Carrito
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
