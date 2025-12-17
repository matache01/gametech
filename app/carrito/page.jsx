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

/* ======================================================================
  HELPERS
====================================================================== */

function makeItemKey(it) {
  // Se mantiene esta función para usarla como clave de fila en la tabla
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
    // updateQuantity, // No se usa directamente en este componente, pero se podría usar
    // clearCart, // No se usa directamente en este componente, pero se podría usar
    isLoaded,
  } = useCart();

  const count = typeof getCount === "function" ? getCount() : 0;
  const total = typeof getTotal === "function" ? getTotal() : 0;

  // ❗ Se eliminó toda la lógica de carga de imágenes (estado, ref, y useEffect)

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
                      {/* <td>
                          ❗ Se eliminó el div completo que contenía la imagen.
                      </td> */}
                      <td>
                        {/* Se muestra solo el nombre del producto directamente */}
                        <div className="d-flex gap-3 align-items-center">
                          {it.nombre}
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
