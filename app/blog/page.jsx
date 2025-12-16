// app/blog/page.jsx
"use client";

import { Container, Row, Col, Card, Button, Badge } from "react-bootstrap";
import Link from "next/link";

export default function BlogPage() {
  const blogs = [
    {
      id: 1,
      titulo: "Guía Definitiva: Cómo Elegir el Mouse Perfecto para Gaming",
      resumen:
        "Descubre los factores clave para seleccionar el mouse gaming ideal según tu estilo de juego y preferencias.",
      contenido:
        "En el mundo del gaming, el mouse es una de las herramientas más importantes...",
      imagen: "/assets/productos/M1.jpg",
      fecha: "15 Nov 2024",
      autor: "Matias Vega",
      categoria: "Hardware",
      tiempoLectura: "5 min",
      tags: ["Mouse", "Gaming", "Hardware", "Guía"],
    },
    {
      id: 2,
      titulo:
        "Los Beneficios de los Teclados Mecánicos para Programadores y Gamers",
      resumen:
        "Exploramos por qué los teclados mecánicos se han convertido en el estándar para gamers y profesionales.",
      contenido:
        "Los teclados mecánicos han revolucionado la experiencia de escritura y gaming...",
      imagen: "/assets/productos/T1.jpg",
      fecha: "10 Nov 2024",
      autor: "Felipe Salazar",
      categoria: "Tecnología",
      tiempoLectura: "7 min",
      tags: ["Teclados", "Mecánico", "Productividad", "Tecnología"],
    },
  ];

  const categorias = [
    { nombre: "Hardware", cantidad: 8 },
    { nombre: "Tecnología", cantidad: 5 },
    { nombre: "Gaming", cantidad: 12 },
    { nombre: "Reviews", cantidad: 6 },
    { nombre: "Tutoriales", cantidad: 4 },
  ];

  const postsPopulares = [
    { titulo: "Top 5 Monitores Gaming 2024", visits: 1245 },
    { titulo: "Cómo Mejorar tu Setup Gaming", visits: 987 },
    { titulo: "Guía de Auriculares Inalámbricos", visits: 756 },
    { titulo: "RGB: Estética vs Rendimiento", visits: 643 },
  ];

  return (
    <Container className="py-5">
      {/* Header */}
      <Row className="mb-5">
        <Col className="text-center">
          <h1 className="display-4 fw-bold text-primary mb-3">Blog GameTech</h1>
          <p className="lead text-muted">
            Descubre las últimas tendencias, reviews y consejos del mundo gaming
          </p>
        </Col>
      </Row>

      <Row>
        {/* Lista de Blogs */}
        <Col lg={8}>
          <div className="mb-4">
            <h2 className="h4 mb-4">Últimas Publicaciones</h2>
            <Row className="g-4">
              {blogs.map((blog) => (
                <Col key={blog.id} xs={12}>
                  <Card className="border-0 shadow-sm h-100 blog-card">
                    <Row className="g-0 h-100">
                      <Col md={4}>
                        <Card.Img
                          variant="top"
                          src={blog.imagen}
                          alt={blog.titulo}
                          style={{
                            height: "100%",
                            objectFit: "cover",
                            minHeight: "200px",
                          }}
                          onError={(e) => {
                            e.target.src =
                              "https://via.placeholder.com/300x200/007bff/ffffff?text=Blog+Image";
                          }}
                        />
                      </Col>
                      <Col md={8}>
                        <Card.Body className="d-flex flex-column h-100">
                          <div className="mb-2">
                            <Badge bg="primary" className="me-2">
                              {blog.categoria}
                            </Badge>
                            <small className="text-muted">
                              {blog.tiempoLectura} de lectura
                            </small>
                          </div>

                          <Card.Title className="h5">
                            <Link
                              href={`/blog/${blog.id}`}
                              className="text-dark text-decoration-none"
                            >
                              {blog.titulo}
                            </Link>
                          </Card.Title>

                          <Card.Text className="text-muted flex-grow-1">
                            {blog.resumen}
                          </Card.Text>

                          <div className="mt-auto">
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <small className="text-muted">
                                  Por <strong>{blog.autor}</strong> •{" "}
                                  {blog.fecha}
                                </small>
                              </div>
                              <Link
                                href={`/blog/${blog.id}`}
                                className="btn btn-outline-primary btn-sm"
                              >
                                Leer Más
                              </Link>
                            </div>
                          </div>
                        </Card.Body>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </Col>

        {/* Sidebar */}
        <Col lg={4}>
          {/* Categorías */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0">📂 Categorías</h5>
            </Card.Header>
            <Card.Body>
              <div className="list-group list-group-flush">
                {categorias.map((categoria, index) => (
                  <div
                    key={index}
                    className="list-group-item d-flex justify-content-between align-items-center border-0 px-0"
                  >
                    <span className="text-primary">{categoria.nombre}</span>
                    <Badge bg="light" text="dark">
                      {categoria.cantidad}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* Posts Populares */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0">🔥 Populares</h5>
            </Card.Header>
            <Card.Body>
              <div className="list-group list-group-flush">
                {postsPopulares.map((post, index) => (
                  <div key={index} className="list-group-item border-0 px-0">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-1 small">{post.titulo}</h6>
                        <small className="text-muted">
                          {post.visits} visitas
                        </small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* Newsletter */}
          <Card className="border-0 shadow-sm bg-primary text-white">
            <Card.Body className="text-center">
              <h5 className="mb-3">📧 Newsletter</h5>
              <p className="small mb-3">
                Suscríbete y recibe las últimas noticias del mundo gaming
              </p>
              <div className="mb-3">
                <input
                  type="email"
                  className="form-control"
                  placeholder="tu@email.com"
                />
              </div>
              <Button variant="light" className="w-100 text-primary">
                Suscribirse
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
