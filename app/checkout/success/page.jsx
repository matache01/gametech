"use client";

import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import { useRouter } from "next/navigation";

/**
 * Página de éxito del checkout
 * - Lee sessionStorage.lastOrder (set por el checkout) y muestra un resumen breve.
 * - Si no encuentra lastOrder intenta leer el query param "order" y, si hay id,
 *   intenta recuperar /api/ventas/:id (si tu API lo soporta).
 * - Si no hay nada muestra un mensaje amigable.
 *
 * Pegar en: app/checkout/success/page.jsx (rama draft/youthful-hill)
 */

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        // 1) intentar sessionStorage.lastOrder
        if (typeof window !== "undefined") {
          const raw = sessionStorage.getItem("lastOrder");
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (mounted) {
                setOrder(parsed);
                setLoading(false);
                return;
              }
            } catch {
              // ignore and continue
            }
          }

          // 2) intentar query param ?order=<id> y fetch a /api/ventas/:id si existe
          const params = new URLSearchParams(window.location.search);
          const orderId = params.get("order");
          if (orderId) {
            try {
              const res = await fetch(
                `/api/ventas/${encodeURIComponent(orderId)}`
              ).catch(() => null);
              if (res && res.ok) {
                const data = await res.json().catch(() => null);
                if (mounted) {
                  setOrder(data?.venta ?? data ?? null);
                  setLoading(false);
                  return;
                }
              }
            } catch (err) {
              // ignore fetch failure, fallback to message
            }
          }
        }

        if (mounted) {
          setError(
            "No se encontró información del pedido. Si el pago se realizó, revisa tu correo o contacta soporte."
          );
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError("Error al leer el pedido.");
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    );
  }

  if (!order) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="shadow-sm">
              <Card.Body className="text-center">
                <h4>Gracias por tu compra</h4>
                <p className="text-muted">
                  No encontramos los datos del pedido en esta sesión. Si
                  completaste el pago, revisa el correo que indicaste o contacta
                  soporte.
                </p>
                <div className="d-flex justify-content-center gap-2 mt-3">
                  <Button
                    variant="primary"
                    onClick={() => router.push("/productos")}
                  >
                    Ver productos
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => router.push("/contacto")}
                  >
                    Contactar soporte
                  </Button>
                </div>
                {error && <div className="mt-3 text-danger small">{error}</div>}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  // Order exists -> normalize fields for display
  const orderId =
    order.id ?? order.orderId ?? order.pedidoId ?? order._id ?? "";
  const direccion =
    order.direccion ?? order.meta?.direccion ?? order.address ?? "";
  const meta = order.meta ?? {};
  const detalles = Array.isArray(order.detalles)
    ? order.detalles
    : order.items ?? order.lineItems ?? [];

  const total =
    order.total ??
    detalles.reduce(
      (s, d) => s + Number(d.subtotal ?? d.precioUnitario ?? d.price ?? 0),
      0
    );

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={10}>
          <Card className="shadow-sm">
            <Card.Body>
              <h3 className="mb-2">¡Pedido recibido!</h3>
              <p className="text-muted">
                Gracias por tu compra. Se ha generado el pedido{" "}
                <strong>{orderId}</strong>. Revisa tu correo para más detalles.
              </p>

              <Row className="mt-4">
                <Col md={6}>
                  <h6>Datos del pedido</h6>
                  <div className="small text-muted">Total</div>
                  <div className="h5 mb-2">
                    ${Number(total || 0).toLocaleString("es-CL")}
                  </div>

                  <div className="small text-muted">Dirección</div>
                  <div className="mb-2">
                    {direccion || meta?.direccion || "-"}
                  </div>

                  <div className="small text-muted">Contacto</div>
                  <div>{meta?.nombre || meta?.email || "-"}</div>
                  <div className="small text-muted">{meta?.telefono || ""}</div>
                </Col>

                <Col md={6}>
                  <h6>Resumen de artículos</h6>
                  {detalles && detalles.length > 0 ? (
                    <Table size="sm" bordered hover className="mt-2">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th style={{ width: 80 }}>Cant.</th>
                          <th style={{ width: 120 }} className="text-end">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalles.map((d, i) => {
                          const nombre =
                            d.nombre ??
                            d.productName ??
                            d.title ??
                            d.productoNombre ??
                            d.productoId ??
                            `#${d.productoId ?? i}`;
                          const cantidad =
                            Number(d.cantidad ?? d.qty ?? d.quantity ?? 1) || 1;
                          const subtotal =
                            Number(
                              d.subtotal ?? d.precioUnitario ?? d.price ?? 0
                            ) || 0;
                          return (
                            <tr key={i}>
                              <td
                                style={{
                                  maxWidth: 220,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {nombre}
                              </td>
                              <td className="text-center">{cantidad}</td>
                              <td className="text-end">
                                ${Number(subtotal).toLocaleString("es-CL")}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  ) : (
                    <div className="text-muted small">
                      No hay detalles disponibles.
                    </div>
                  )}
                </Col>
              </Row>

              <div className="d-flex justify-content-end mt-3">
                <Button
                  variant="outline-primary"
                  className="me-2"
                  onClick={() => router.push("/productos")}
                >
                  Seguir comprando
                </Button>
                <Button
                  variant="primary"
                  onClick={() => router.push("/contacto")}
                >
                  Contactar soporte
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
