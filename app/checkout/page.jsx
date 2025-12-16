"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Form,
  Button,
  Badge,
  Alert,
  Spinner,
} from "react-bootstrap";
import { useRouter } from "next/navigation";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

/* ---------- Helpers de regiones (copiado desde tu archivo actual) ---------- */
const REGION_COMUNAS = {
  "Arica y Parinacota": ["Arica", "Camarones", "Putre", "General Lagos"],
  Tarapacá: [
    "Iquique",
    "Alto Hospicio",
    "Pozo Almonte",
    "Camiña",
    "Colchane",
    "Huatacondo",
    "Huara",
    "Pica",
  ],
  Antofagasta: [
    "Antofagasta",
    "Mejillones",
    "Sierra Gorda",
    "Taltal",
    "Calama",
    "Ollagüe",
    "San Pedro de Atacama",
    "Tocopilla",
    "María Elena",
  ],
  Atacama: [
    "Copiapó",
    "Caldera",
    "Tierra Amarilla",
    "Chañaral",
    "Diego de Almagro",
    "Vallenar",
    "Alto del Carmen",
    "Freirina",
    "Huasco",
  ],
  Coquimbo: [
    "La Serena",
    "Coquimbo",
    "Andacollo",
    "La Higuera",
    "Paiguano",
    "Vicuña",
    "Illapel",
    "Canela",
    "Los Vilos",
    "Salamanca",
    "Ovalle",
    "Combarbalá",
    "Monte Patria",
    "Punitaqui",
    "Río Hurtado",
  ],
  Valparaíso: [
    "Valparaíso",
    "Casablanca",
    "Concón",
    "Juan Fernández",
    "Puchuncaví",
    "Quintero",
    "Viña del Mar",
    "Isla de Pascua",
    "Los Andes",
    "Calle Larga",
    "Rinconada",
    "San Esteban",
    "La Ligua",
    "Cabildo",
    "Papudo",
    "Petorca",
    "Zapallar",
    "Quillota",
    "Calera",
    "Hijuelas",
    "La Cruz",
    "Nogales",
    "San Antonio",
    "Algarrobo",
    "Cartagena",
    "El Quisco",
    "El Tabo",
    "Santo Domingo",
    "San Felipe",
    "Putaendo",
    "Catemu",
    "Llaillay",
    "Panquehue",
    "Santa María",
  ],
  Metropolitana: [
    "Cerrillos",
    "Cerro Navia",
    "Conchalí",
    "El Bosque",
    "Estación Central",
    "Huechuraba",
    "Independencia",
    "La Cisterna",
    "La Florida",
    "La Granja",
    "La Pintana",
    "La Reina",
    "Las Condes",
    "Lo Barnechea",
    "Lo Espejo",
    "Lo Prado",
    "Macul",
    "Maipú",
    "Ñuñoa",
    "Pedro Aguirre Cerda",
    "Peñalolén",
    "Providencia",
    "Pudahuel",
    "Quilicura",
    "Quinta Normal",
    "Recoleta",
    "Renca",
    "San Joaquín",
    "San Miguel",
    "San Ramón",
    "Santiago",
    "Vitacura",
    "Puente Alto",
    "Pirque",
    "San José de Maipo",
    "Colina",
    "Lampa",
    "Tiltil",
  ],
  "O'Higgins": [
    "Rancagua",
    "Codegua",
    "Coinco",
    "Coltauco",
    "Doñihue",
    "Graneros",
    "Las Cabras",
    "Machalí",
    "Malloa",
    "Mostazal",
    "Olivar",
    "Peumo",
    "Pichidegua",
    "Quinta de Tilcoco",
    "Rengo",
    "San Vicente",
    "Pichilegua",
    "Pichilemu",
    "La Estrella",
    "Litueche",
    "Marchihue",
    "Navidad",
    "Paredones",
    "Chimbarongo",
    "San Fernando",
    "Nancagua",
    "Santa Cruz",
    "Palmilla",
    "Placilla",
    "Peralillo",
  ],
  Maule: [
    "Talca",
    "Constitución",
    "Curepto",
    "Empedrado",
    "Maule",
    "Pelarco",
    "Pencahue",
    "Río Claro",
    "San Clemente",
    "San Rafael",
    "Cauquenes",
    "Chanco",
    "Pelluhue",
    "Curicó",
    "Hualañé",
    "Licantén",
    "Molina",
    "Rauco",
    "Romeral",
    "Sagrada Familia",
    "Teno",
    "Vichuquén",
    "Linares",
    "Colbún",
    "Longaví",
    "Parral",
    "Retiro",
    "San Javier",
    "Villa Alegre",
    "Yerbas Buenas",
  ],
  Ñuble: [
    "Bulnes",
    "Chillán",
    "Chillán Viejo",
    "Cobquecura",
    "Coelemu",
    "Coihueco",
    "El Carmen",
    "Ninhue",
    "Ñiquén",
    "Pemuco",
    "Pinto",
    "Quillón",
    "Quirihue",
    "Ránquil",
    "San Carlos",
    "San Fabián",
    "San Ignacio",
    "San Nicolás",
    "Treguaco",
    "Yungay",
  ],
  Biobío: [
    "Concepción",
    "Coronel",
    "Chiguayante",
    "Florida",
    "Hualqui",
    "Lota",
    "Penco",
    "San Pedro de la Paz",
    "Santa Juana",
    "Talcahuano",
    "Tomé",
    "Hualpén",
    "Lebu",
    "Arauco",
    "Cañete",
    "Los Álamos",
    "Cabrero",
    "Laja",
    "Mulchén",
    "Nacimiento",
    "Negrete",
    "Tucapel",
    "Yumbel",
    "Alto Biobío",
    "Antuco",
    "Santa Bárbara",
    "Quilleco",
    "San Rosendo",
    "Quilaco",
  ],
  Araucanía: [
    "Temuco",
    "Carahue",
    "Cunco",
    "Curarrehue",
    "Freire",
    "Galvarino",
    "Gorbea",
    "Lautaro",
    "Loncoche",
    "Melipeuco",
    "Nueva Imperial",
    "Padre Las Casas",
    "Perquenco",
    "Pitrufquén",
    "Pucón",
    "Villarrica",
    "Panguipulli",
    "Cholchol",
    "Angol",
    "Victoria",
    "Lonquimay",
    "Collipulli",
    "Ercilla",
    "Traiguén",
    "Los Sauces",
  ],
  "Los Ríos": [
    "Valdivia",
    "Corral",
    "Lanco",
    "Los Lagos",
    "Máfil",
    "Mariquina",
    "Paillaco",
    "Panguipulli",
    "La Unión",
    "Futrono",
    "Lago Ranco",
    "Río Bueno",
  ],
  "Los Lagos": [
    "Puerto Montt",
    "Calbuco",
    "Cochamó",
    "Fresia",
    "Frutillar",
    "Los Muermos",
    "Llanquihue",
    "Maullín",
    "Puerto Varas",
    "Castro",
    "Chonchi",
    "Curaco de Vélez",
    "Dalcahue",
    "Puqueldón",
    "Queilén",
    "Quellón",
    "Quemchi",
    "Quinchao",
    "Osorno",
    "Purranque",
    "Puerto Octay",
    "Puyehue",
    "Río Negro",
    "San Pablo",
    "Ancud",
    "Chaitén",
  ],
  Aysén: [
    "Coyhaique",
    "Lago Verde",
    "Aysén",
    "Cisnes",
    "Guaitecas",
    "Río Ibáñez",
    "Chile Chico",
    "Cochrane",
    "O'Higgins",
    "Tortel",
    "Puerto Aysén",
  ],
  "Magallanes y de la Antártica Chilena": [
    "Punta Arenas",
    "Laguna Blanca",
    "Río Verde",
    "San Gregorio",
    "Cabo de Hornos",
    "Antártica",
    "Porvenir",
    "Primavera",
    "Timaukel",
    "Natales",
    "Torres del Paine",
    "Puerto Williams",
  ],
};
const REGIONS = Object.keys(REGION_COMUNAS);
/* ------------------------------------------------------------------------------------------------------ */

/* ---------- Helpers para ofertas: ahora obtenemos datos desde /api/productos ---------- */
/**
 * Antes usábamos /api/offers — ahora esa API fue reemplazada por /api/productos.
 * Aquí pedimos /api/productos y extraemos la información de oferta desde cada producto
 * si contiene campos como 'oferta', 'oferPorcentaje', 'precio' etc.
 */
const loadOffers = async () => {
  try {
    const res = await fetch("/api/productos");
    if (!res.ok) return { offersArray: [], offersMap: new Map() };
    const prods = await res.json().catch(() => []);
    const map = new Map();
    for (const p of Array.isArray(prods) ? prods : []) {
      const pid = String(p.id ?? p._id ?? p.sku ?? "").trim();
      if (!pid) continue;
      // If product declares an offer, create an offer entry
      const oferta = !!p.oferta || !!p.hasOffer;
      const percent = Number(p.oferPorcentaje ?? p.offerPercent ?? 0) || 0;
      if (oferta || percent > 0) {
        const oldPrice = Number(p.precio ?? p.price ?? 0) || 0;
        const newPrice = percent
          ? Math.round(oldPrice * (1 - percent / 100))
          : oldPrice;
        map.set(pid, { oldPrice, newPrice, percent, source: "productos" });
      }
    }
    return { offersArray: Array.from(map.values()), offersMap: map };
  } catch (err) {
    console.warn("loadOffers error:", err);
    return { offersArray: [], offersMap: new Map() };
  }
};

const getOfferForProduct = (offersMap, product) => {
  if (!offersMap || !product) return null;
  const pid = String(product.id ?? product._id ?? product.sku ?? "").trim();
  return offersMap.get(pid) || null;
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
/* ---------------------------------------------------------------------- */

export default function CheckoutPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user } = auth || {};

  const cartContext = useCart();
  const cartItems = cartContext.items ?? cartContext.cart ?? [];
  // We won't rely on createOrder from context (it may not exist) — we'll POST directly.
  const clearCart =
    typeof cartContext.clearCart === "function"
      ? cartContext.clearCart
      : () => {};

  // offers
  const [offersMap, setOffersMap] = useState(new Map());
  const [offersLoading, setOffersLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setOffersLoading(true);
      try {
        const { offersMap: om } = await loadOffers();
        if (!mounted) return;
        setOffersMap(om);
      } catch (err) {
        if (mounted) setOffersMap(new Map());
      } finally {
        if (mounted) setOffersLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // compute total using effective prices (offers applied if any)
  const totalEffective = useMemo(() => {
    let sum = 0;
    for (const it of cartItems || []) {
      const offer = getOfferForProduct(offersMap, it);
      const ef = getEffectivePrice(it, offer);
      const qty = Number(it.cantidad || it.quantity || it.qty || 1) || 1;
      sum += Number(ef.price || 0) * qty;
    }
    return sum;
  }, [cartItems, offersMap]);

  const total = useMemo(() => {
    return (cartItems || []).reduce(
      (s, it) =>
        s +
        (Number(it.precio || it.price || 0) * Number(it.cantidad || 0) || 0),
      0
    );
  }, [cartItems]);

  const [blocked, setBlocked] = useState(null);

  useEffect(() => {
    const hasItems = Array.isArray(cartItems) && cartItems.length > 0;
    setBlocked(!hasItems);
  }, [cartItems]);

  const [form, setForm] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    calle: "",
    depto: "",
    region: "",
    comuna: "",
    instrucciones: "",
  });

  const [comunasOptions, setComunasOptions] = useState([
    "Selecciona una comuna",
  ]);
  const [errors, setErrors] = useState({});
  const [serverMsg, setServerMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      const userRegion = user.region || user.región || user.regionName || "";
      const normalizedRegion =
        REGIONS.find(
          (r) => String(r).toLowerCase() === String(userRegion).toLowerCase()
        ) || "";
      const userComuna = user.comuna || user.commune || "";

      setForm((prev) => ({
        ...prev,
        nombre: user.nombre || prev.nombre || "",
        apellidos: user.apellidos || user.apellido || prev.apellidos || "",
        email: user.email || user.mail || prev.email || "",
        telefono: user.telefono || prev.telefono || "",
        calle: user.direccion || user.calle || prev.calle || "",
        depto: user.depto || user.numero || prev.depto || "",
        region: normalizedRegion || prev.region || "",
        comuna: normalizedRegion
          ? REGION_COMUNAS[normalizedRegion].includes(userComuna)
            ? userComuna
            : REGION_COMUNAS[normalizedRegion][0]
          : prev.comuna || "",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (form.region && REGION_COMUNAS[form.region]) {
      setComunasOptions(REGION_COMUNAS[form.region]);
      if (!REGION_COMUNAS[form.region].includes(form.comuna)) {
        setForm((prev) => ({
          ...prev,
          comuna: REGION_COMUNAS[form.region][0] || "",
        }));
      }
    } else {
      setComunasOptions(["Selecciona una comuna"]);
      setForm((prev) => ({ ...prev, comuna: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.region]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerMsg(null);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.nombre || !form.nombre.trim())
      newErrors.nombre = "Nombre requerido";
    if (!form.email || !form.email.trim()) newErrors.email = "Correo requerido";
    if (!form.calle || !form.calle.trim())
      newErrors.calle = "Calle / dirección requerida";
    if (!form.region || !form.region.trim())
      newErrors.region = "Región requerida";
    if (!form.comuna || form.comuna === "Selecciona una comuna")
      newErrors.comuna = "Comuna requerida";
    return newErrors;
  };

  // Build detalles array from cart items
  const buildDetallesFromCart = () => {
    return (cartItems || []).map((it) => {
      const productoId = Number(it.id ?? it.productoId ?? it._id ?? 0) || 0;
      const cantidad = Number(it.cantidad ?? it.qty ?? it.quantity ?? 1) || 1;
      const precioUnitario = Number(it.precio ?? it.price ?? 0) || 0;
      const subtotal = precioUnitario * cantidad;
      return { productoId, cantidad, precioUnitario, subtotal };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerMsg(null);
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!cartItems || cartItems.length === 0) {
      setServerMsg({ type: "danger", text: "El carrito está vacío." });
      return;
    }

    setIsSubmitting(true);
    try {
      const direccionFull = `${form.calle}${
        form.depto ? " #" + form.depto : ""
      }, ${form.comuna}, ${form.region}`;
      const usuarioId = Number(
        user?.id ?? user?.usuarioId ?? user?.userId ?? user?.uid ?? 0
      );

      const detalles = buildDetallesFromCart();
      const totalToSend = Number(
        totalEffective ||
          detalles.reduce((s, d) => s + Number(d.subtotal || 0), 0)
      );

      const payload = {
        direccion: direccionFull,
        usuarioId: usuarioId || 0,
        total: totalToSend,
        detalles,
        meta: {
          nombre: form.nombre,
          email: form.email,
          telefono: form.telefono,
          instrucciones: form.instrucciones,
        },
      };

      // Headers (include authorization if user.token exists)
      const headers = { "Content-Type": "application/json" };
      if (user?.token) headers["Authorization"] = `Bearer ${user.token}`;

      // POST directly to /api/ventas (no reliance on createOrder)
      const res = await fetch("/api/ventas", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const text = await res.text().catch(() => "");
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }

      if (!res.ok && res.status !== 201) {
        const message =
          (data && (data.error || data.message)) ||
          `Error creando pedido (${res.status})`;
        throw new Error(message);
      }

      const created = (data && (data.venta ?? data.order ?? data)) || null;
      // Store last order for success page
      try {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            "lastOrder",
            JSON.stringify(created ?? payload)
          );
        }
      } catch (err) {
        // ignore
      }

      // clear cart on success
      try {
        clearCart();
      } catch (err) {
        // ignore
      }

      // Redirect to success
      const createdId =
        created?.id ?? created?.orderId ?? created?.pedidoId ?? "";
      router.push(
        `/checkout/success?order=${encodeURIComponent(createdId ?? "")}`
      );
    } catch (err) {
      console.error("Checkout submit error:", err);
      setServerMsg({
        type: "danger",
        text: err?.message || "Error procesando el pedido",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (blocked === null) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    );
  }

  if (blocked) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={8}>
            <Card className="shadow-sm">
              <Card.Body className="text-center">
                <h4 className="mb-3">Tu carrito está vacío</h4>
                <p className="text-muted">
                  Debes agregar al menos un producto al carrito antes de acceder
                  al checkout.
                </p>
                <div className="d-flex justify-content-center gap-2 mt-3">
                  <Button
                    variant="primary"
                    onClick={() => router.push("/productos")}
                  >
                    Ver Productos
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={() => router.push("/carrito")}
                  >
                    Ir al Carrito
                  </Button>
                </div>
                <div className="mt-3 text-muted small">
                  Si sigues teniendo problemas, asegúrate de que tu sesión esté
                  activa y que los productos se hayan agregado correctamente.
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={10}>
          <Card className="shadow-sm">
            <Card.Body>
              <h4 className="mb-3">Carrito de compra</h4>

              {serverMsg && (
                <Alert
                  variant={serverMsg.type}
                  onClose={() => setServerMsg(null)}
                  dismissible
                >
                  {serverMsg.text}
                </Alert>
              )}

              <Row>
                <Col lg={8}>
                  <Table
                    responsive
                    bordered
                    hover
                    size="sm"
                    className="align-middle"
                  >
                    <thead>
                      <tr>
                        <th style={{ width: 80 }}>Imagen</th>
                        <th>Nombre</th>
                        <th style={{ width: 110 }}>Precio</th>
                        <th style={{ width: 110 }}>Oferta</th>
                        <th style={{ width: 110 }}>Cantidad</th>
                        <th style={{ width: 140 }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems && cartItems.length > 0 ? (
                        cartItems.map((it) => {
                          const offer = getOfferForProduct(offersMap, it);
                          const ef = getEffectivePrice(it, offer);
                          const qty =
                            Number(it.cantidad || it.quantity || it.qty || 1) ||
                            1;
                          return (
                            <tr key={it.id ?? `${it.nombre}-${Math.random()}`}>
                              <td>
                                {it.imagen ? (
                                  <img
                                    src={it.imagen}
                                    alt={it.nombre}
                                    style={{
                                      width: 64,
                                      height: 48,
                                      objectFit: "cover",
                                      borderRadius: 4,
                                    }}
                                    onError={(e) =>
                                      (e.target.src =
                                        "/assets/productos/placeholder.png")
                                    }
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: 64,
                                      height: 48,
                                      background: "#f5f5f5",
                                      borderRadius: 4,
                                    }}
                                  />
                                )}
                              </td>
                              <td>{it.nombre}</td>
                              <td className="text-end">
                                {ef && ef.oldPrice
                                  ? `$${Number(ef.oldPrice).toLocaleString(
                                      "es-CL"
                                    )}`
                                  : `$${Number(it.precio || 0).toLocaleString(
                                      "es-CL"
                                    )}`}
                              </td>
                              <td className="text-center">
                                {ef && ef.percent ? (
                                  <Badge bg="danger">-{ef.percent}%</Badge>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                              <td className="text-center">{qty}</td>
                              <td className="text-end">
                                $
                                {(
                                  Number(ef.price || it.precio || 0) * qty
                                ).toLocaleString("es-CL")}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center text-muted py-4"
                          >
                            Tu carrito está vacío.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Col>

                <Col lg={4}>
                  <Card className="mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <h6 className="mb-0">Resumen</h6>
                          <small className="text-muted">
                            Productos: {cartItems.length}
                          </small>
                        </div>
                        <Badge bg="primary" pill>
                          Total a pagar
                        </Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <div className="fw-bold">Total</div>
                        <div className="h5 text-primary">
                          ${Number(totalEffective || 0).toLocaleString("es-CL")}
                        </div>
                      </div>
                      <div className="mt-3 text-muted small">
                        Una vez realizado el pago, recibirás un correo con los
                        detalles y despacho.
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <hr className="my-4" />

              <h5>Información del cliente</h5>
              <p className="text-muted">Completa la siguiente información</p>

              <Form onSubmit={handleSubmit}>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Nombre *</Form.Label>
                      <Form.Control
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        isInvalid={!!errors.nombre}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.nombre}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Apellidos</Form.Label>
                      <Form.Control
                        name="apellidos"
                        value={form.apellidos}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Correo *</Form.Label>
                      <Form.Control
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        isInvalid={!!errors.email}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Teléfono</Form.Label>
                      <Form.Control
                        name="telefono"
                        value={form.telefono}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <hr className="my-4" />

                <h5>Dirección de entrega</h5>
                <p className="text-muted">
                  Ingresa la dirección de forma detallada
                </p>

                <Row className="g-3">
                  <Col md={8}>
                    <Form.Group>
                      <Form.Label>Calle / Dirección *</Form.Label>
                      <Form.Control
                        name="calle"
                        value={form.calle}
                        onChange={handleChange}
                        isInvalid={!!errors.calle}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.calle}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Departamento (opcional)</Form.Label>
                      <Form.Control
                        name="depto"
                        value={form.depto}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Región *</Form.Label>
                      <Form.Select
                        name="region"
                        value={form.region}
                        onChange={handleChange}
                        isInvalid={!!errors.region}
                      >
                        <option value="">Selecciona una región</option>
                        {REGIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.region}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Comuna *</Form.Label>
                      <Form.Select
                        name="comuna"
                        value={form.comuna}
                        onChange={handleChange}
                        isInvalid={!!errors.comuna}
                      >
                        {comunasOptions && comunasOptions.length > 0 ? (
                          comunasOptions.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))
                        ) : (
                          <option value="">Selecciona una comuna</option>
                        )}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.comuna}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>
                        Indicaciones para la entrega (opcional)
                      </Form.Label>
                      <Form.Control
                        name="instrucciones"
                        as="textarea"
                        rows={3}
                        value={form.instrucciones}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end mt-4">
                  <Button
                    variant="secondary"
                    className="me-2"
                    onClick={() => router.push("/carrito")}
                  >
                    Volver al carrito
                  </Button>
                  <Button
                    variant="success"
                    type="submit"
                    disabled={isSubmitting || cartItems.length === 0}
                  >
                    {isSubmitting
                      ? "Procesando..."
                      : `Pagar ahora $ ${Number(
                          totalEffective || 0
                        ).toLocaleString("es-CL")}`}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          <div className="text-center text-muted small mt-3">
            Nota: Si el usuario ha iniciado sesión, parte de esta información se
            rellenará automáticamente.
          </div>
        </Col>
      </Row>
    </Container>
  );
}
