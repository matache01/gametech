// app/contacto/page.jsx
"use client";

import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  ListGroup,
} from "react-bootstrap";
import { useState } from "react";

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    asunto: "",
    mensaje: "",
  });
  const [errors, setErrors] = useState({});
  const [showAlert, setShowAlert] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validaciones
    if (!formData.nombre.trim()) {
      newErrors.nombre = "Por favor ingresa tu nombre.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Por favor ingresa tu correo electrónico.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Por favor ingresa un correo válido.";
    }

    if (!formData.asunto.trim()) {
      newErrors.asunto = "Por favor selecciona un asunto.";
    }

    if (!formData.mensaje.trim()) {
      newErrors.mensaje = "Por favor ingresa tu mensaje.";
    } else if (formData.mensaje.trim().length < 10) {
      newErrors.mensaje = "El mensaje debe tener al menos 10 caracteres.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Simular envío
    console.log("Formulario enviado:", formData);
    setShowAlert(true);
    setFormData({
      nombre: "",
      email: "",
      telefono: "",
      asunto: "",
      mensaje: "",
    });

    setTimeout(() => setShowAlert(false), 5000);
  };

  const informacionContacto = [
    {
      icon: "📧",
      titulo: "Email",
      contenido: "contacto@gametech.cl",
      descripcion: "Respondemos en menos de 24 horas",
    },
    {
      icon: "📞",
      titulo: "Teléfono",
      contenido: "+56 9 1234 5678",
      descripcion: "Lunes a Viernes 9:00 - 18:00",
    },
    {
      icon: "📍",
      titulo: "Dirección",
      contenido: "Av. Principal 123, Santiago",
      descripcion: "Visita nuestra tienda física",
    },
    {
      icon: "🕒",
      titulo: "Horario de Atención",
      contenido: "Lun - Vie: 9:00 - 18:00",
      descripcion: "Sábados: 10:00 - 14:00",
    },
  ];

  const preguntasFrecuentes = [
    {
      pregunta: "¿Realizan envíos a todo Chile?",
      respuesta:
        "Sí, realizamos envíos a todo Chile con diferentes opciones de delivery.",
    },
    {
      pregunta: "¿Qué métodos de pago aceptan?",
      respuesta:
        "Aceptamos tarjetas de crédito, débito, transferencias y Webpay.",
    },
    {
      pregunta: "¿Ofrecen garantía en los productos?",
      respuesta:
        "Todos nuestros productos incluyen garantía oficial del fabricante.",
    },
    {
      pregunta: "¿Puedo retirar mi pedido en tienda?",
      respuesta: "Sí, ofrecemos retiro en tienda sin costo adicional.",
    },
  ];

  return (
    <Container className="py-5">
      {/* Header */}
      <Row className="mb-5">
        <Col className="text-center">
          <h1 className="display-4 fw-bold text-primary mb-3">Contáctanos</h1>
          <p className="lead text-muted">
            ¿Tienes alguna pregunta? Estamos aquí para ayudarte
          </p>
        </Col>
      </Row>

      <Row>
        {/* Formulario de Contacto */}
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0">📝 Envíanos un Mensaje</h5>
            </Card.Header>
            <Card.Body className="p-4">
              {showAlert && (
                <Alert variant="success" className="mb-4">
                  ✅ ¡Mensaje enviado correctamente! Te contactaremos pronto.
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nombre Completo *</Form.Label>
                      <Form.Control
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        isInvalid={!!errors.nombre}
                        placeholder="Tu nombre completo"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.nombre}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email *</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        isInvalid={!!errors.email}
                        placeholder="tu@email.com"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Teléfono (Opcional)</Form.Label>
                  <Form.Control
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    placeholder="+56 9 1234 5678"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Asunto *</Form.Label>
                  <Form.Select
                    name="asunto"
                    value={formData.asunto}
                    onChange={handleInputChange}
                    isInvalid={!!errors.asunto}
                  >
                    <option value="">Selecciona un asunto</option>
                    <option value="consulta">Consulta General</option>
                    <option value="soporte">Soporte Técnico</option>
                    <option value="ventas">Consultas de Ventas</option>
                    <option value="garantia">Garantía y Devoluciones</option>
                    <option value="otros">Otros</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.asunto}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Mensaje *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="mensaje"
                    value={formData.mensaje}
                    onChange={handleInputChange}
                    isInvalid={!!errors.mensaje}
                    placeholder="Describe tu consulta en detalle..."
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.mensaje}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    Mínimo 10 caracteres
                  </Form.Text>
                </Form.Group>

                <div className="d-grid">
                  <Button variant="primary" type="submit" size="lg">
                    Enviar Mensaje
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Información de Contacto */}
        <Col lg={4}>
          {/* Información de Contacto */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0">📞 Información de Contacto</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                {informacionContacto.map((info, index) => (
                  <ListGroup.Item key={index} className="border-0 px-0 py-3">
                    <div className="d-flex align-items-start">
                      <span className="display-6 me-3">{info.icon}</span>
                      <div>
                        <h6 className="mb-1 text-primary">{info.titulo}</h6>
                        <p className="mb-1 fw-bold">{info.contenido}</p>
                        <small className="text-muted">{info.descripcion}</small>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>

          {/* Preguntas Frecuentes */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">❓ Preguntas Frecuentes</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                {preguntasFrecuentes.map((faq, index) => (
                  <ListGroup.Item key={index} className="border-0 px-0 py-3">
                    <h6 className="text-primary mb-2">{faq.pregunta}</h6>
                    <p className="text-muted mb-0 small">{faq.respuesta}</p>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>

          {/* Mapa */}
          <Card className="border-0 shadow-sm mt-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0">🗺️ Nuestra Ubicación</h5>
            </Card.Header>
            <Card.Body className="text-center p-4">
              <div className="bg-light rounded p-4 mb-3">
                <span className="display-4">📍</span>
              </div>
              <h6 className="text-primary">GameTech Store</h6>
              <p className="text-muted small mb-0">
                Av. Principal 123, Santiago
                <br />
                Metro: Estación Central
                <br />
                Estacionamiento disponible
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
