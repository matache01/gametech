// app/nosotros/page.jsx
"use client";

import { Container, Row, Col, Card, Badge, ListGroup } from "react-bootstrap";
import { useState } from "react";

export default function NosotrosPage() {
  const [activeTab, setActiveTab] = useState("mision");

  const equipo = [
    {
      nombre: "Matias Vega",
      cargo: "CEO & Fundador",
      imagen: "/assets/team/matias.jpg",
      descripcion:
        "Apasionado por la tecnología gaming con más de 10 años de experiencia en el rubro.",
      email: "mati.vegaa@duocuc.cl",
    },
    {
      nombre: "Felipe Salazar",
      cargo: "CTO & Co-Fundador",
      imagen: "/assets/team/felipe.jpg",
      descripcion:
        "Especialista en hardware gaming y desarrollo de sistemas de alto rendimiento.",
      email: "fe.salazarv@duocuc.cl",
    },
  ];

  const valores = [
    {
      icon: "🎯",
      titulo: "Calidad Garantizada",
      descripcion:
        "Todos nuestros productos pasan por rigurosos controles de calidad.",
    },
    {
      icon: "🚀",
      titulo: "Innovación Constante",
      descripcion:
        "Siempre a la vanguardia con las últimas tecnologías gaming.",
    },
    {
      icon: "💝",
      titulo: "Atención Personalizada",
      descripcion: "Cada cliente es único y merece la mejor experiencia.",
    },
    {
      icon: "🛡️",
      titulo: "Garantía Extendida",
      descripcion:
        "Todos nuestros productos incluyen garantía oficial del fabricante.",
    },
  ];

  return (
    <Container className="py-5">
      {/* Hero Section */}
      <Row className="mb-5">
        <Col className="text-center">
          <h1 className="display-4 fw-bold text-primary mb-4">
            Sobre Nosotros
          </h1>
          <p className="lead text-muted mx-auto" style={{ maxWidth: "600px" }}>
            En <strong>GameTech</strong> somos apasionados por el gaming y nos
            dedicamos a brindarte los mejores productos para elevar tu
            experiencia al siguiente nivel.
          </p>
        </Col>
      </Row>

      {/* Misión, Visión, Historia */}
      <Row className="mb-5">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light">
              <div className="d-flex flex-wrap gap-2">
                <button
                  className={`btn ${
                    activeTab === "mision"
                      ? "btn-primary"
                      : "btn-outline-primary"
                  } btn-sm`}
                  onClick={() => setActiveTab("mision")}
                >
                  🎯 Nuestra Misión
                </button>
                <button
                  className={`btn ${
                    activeTab === "vision"
                      ? "btn-primary"
                      : "btn-outline-primary"
                  } btn-sm`}
                  onClick={() => setActiveTab("vision")}
                >
                  🔭 Nuestra Visión
                </button>
                <button
                  className={`btn ${
                    activeTab === "historia"
                      ? "btn-primary"
                      : "btn-outline-primary"
                  } btn-sm`}
                  onClick={() => setActiveTab("historia")}
                >
                  📖 Nuestra Historia
                </button>
              </div>
            </Card.Header>
            <Card.Body className="p-4">
              {activeTab === "mision" && (
                <div>
                  <h4 className="text-primary mb-3">Misión</h4>
                  <p className="fs-5">
                    Proporcionar a la comunidad gamer los mejores productos
                    tecnológicos, ofreciendo calidad, innovación y un servicio
                    excepcional que supere las expectativas de nuestros
                    clientes.
                  </p>
                  <ul className="list-unstyled mt-4">
                    <li className="mb-2">✅ Productos de última generación</li>
                    <li className="mb-2">✅ Asesoramiento especializado</li>
                    <li className="mb-2">✅ Soporte técnico permanente</li>
                    <li className="mb-0">✅ Garantía y confianza</li>
                  </ul>
                </div>
              )}
              {activeTab === "vision" && (
                <div>
                  <h4 className="text-primary mb-3">Visión</h4>
                  <p className="fs-5">
                    Ser la tienda de referencia en tecnología gaming en Chile,
                    reconocida por nuestra calidad, innovación y compromiso con
                    la satisfacción total del cliente.
                  </p>
                  <div className="mt-4 p-3 bg-light rounded">
                    <h6 className="fw-bold">Nuestros Objetivos:</h6>
                    <ul className="mb-0">
                      <li>Expandir nuestra presencia a nivel nacional</li>
                      <li>Incorporar las últimas tendencias tecnológicas</li>
                      <li>Desarrollar una comunidad gamer activa</li>
                      <li>Ser líderes en servicio al cliente</li>
                    </ul>
                  </div>
                </div>
              )}
              {activeTab === "historia" && (
                <div>
                  <h4 className="text-primary mb-3">Nuestra Historia</h4>
                  <p className="fs-5">
                    GameTech nació en 2024 de la pasión compartida de dos amigos
                    por el gaming y la tecnología. Comenzamos como un pequeño
                    emprendimiento y hoy somos una tienda especializada en
                    productos gaming de alta gama.
                  </p>
                  <Row className="mt-4">
                    <Col md={6}>
                      <h6 className="fw-bold">📈 Nuestro Crecimiento</h6>
                      <ul>
                        <li>2024: Fundación de GameTech</li>
                        <li>Primer trimestre: +100 clientes satisfechos</li>
                        <li>Actual: +500 productos en catálogo</li>
                      </ul>
                    </Col>
                    <Col md={6}>
                      <h6 className="fw-bold">🏆 Logros Destacados</h6>
                      <ul>
                        <li>Mejor servicio al cliente 2024</li>
                        <li>Proveedor oficial de equipos gaming</li>
                        <li>Comunidad activa de +1,000 gamers</li>
                      </ul>
                    </Col>
                  </Row>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Nuestros Valores */}
      <Row className="mb-5">
        <Col>
          <h2 className="text-center mb-4">Nuestros Valores</h2>
          <Row className="g-4">
            {valores.map((valor, index) => (
              <Col key={index} md={6} lg={3}>
                <Card className="h-100 text-center border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <div className="display-4 mb-3">{valor.icon}</div>
                    <h5 className="text-primary">{valor.titulo}</h5>
                    <p className="text-muted">{valor.descripcion}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>

      {/* Nuestro Equipo */}
      <Row className="mb-5">
        <Col>
          <h2 className="text-center mb-4">Nuestro Equipo</h2>
          <Row className="g-4 justify-content-center">
            {equipo.map((miembro, index) => (
              <Col key={index} md={6} lg={4}>
                <Card className="h-100 text-center border-0 shadow-sm">
                  <Card.Body className="p-4">
                    <div
                      className="rounded-circle bg-light d-flex align-items-center justify-content-center mx-auto mb-3"
                      style={{ width: "120px", height: "120px" }}
                    >
                      <span className="display-4">👤</span>
                    </div>
                    <h5 className="text-primary">{miembro.nombre}</h5>
                    <Badge bg="secondary" className="mb-3">
                      {miembro.cargo}
                    </Badge>
                    <p className="text-muted">{miembro.descripcion}</p>
                    <div className="mt-auto">
                      <small className="text-primary">{miembro.email}</small>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>

      {/* Estadísticas */}
      <Row className="mb-5">
        <Col>
          <Card className="bg-primary text-white text-center">
            <Card.Body className="p-5">
              <Row>
                <Col md={3}>
                  <h2 className="display-4 fw-bold">500+</h2>
                  <p>Productos Disponibles</p>
                </Col>
                <Col md={3}>
                  <h2 className="display-4 fw-bold">1,000+</h2>
                  <p>Clientes Satisfechos</p>
                </Col>
                <Col md={3}>
                  <h2 className="display-4 fw-bold">24/7</h2>
                  <p>Soporte Técnico</p>
                </Col>
                <Col md={3}>
                  <h2 className="display-4 fw-bold">100%</h2>
                  <p>Productos Garantizados</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Por qué elegirnos */}
      <Row>
        <Col>
          <Card className="border-0 bg-light">
            <Card.Body className="p-5 text-center">
              <h2 className="text-primary mb-4">¿Por Qué Elegir GameTech?</h2>
              <Row>
                <Col md={4}>
                  <div className="mb-4">
                    <div className="display-4 text-primary mb-3">⚡</div>
                    <h5>Envío Express</h5>
                    <p className="text-muted">
                      Recibe tus productos en 24-48 horas
                    </p>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="mb-4">
                    <div className="display-4 text-primary mb-3">🔧</div>
                    <h5>Soporte Técnico</h5>
                    <p className="text-muted">Asistencia especializada 24/7</p>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="mb-4">
                    <div className="display-4 text-primary mb-3">💎</div>
                    <h5>Calidad Premium</h5>
                    <p className="text-muted">Productos de primeras marcas</p>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
