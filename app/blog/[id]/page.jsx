// app/blog/[id]/page.jsx
"use client";

import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Breadcrumb,
  Button,
} from "react-bootstrap";
import Link from "next/link";
import { useParams } from "next/navigation";

const blogs = [
  {
    id: 1,
    titulo: "Guía Definitiva: Cómo Elegir el Mouse Perfecto para Gaming",
    contenido: `
            <h3>Introducción</h3>
            <p>En el mundo del gaming, el mouse es una de las herramientas más importantes que puede marcar la diferencia entre la victoria y la derrota. Pero con tantas opciones disponibles, ¿cómo elegir el correcto?</p>
            
            <h3>Factores Clave a Considerar</h3>
            <h4>1. Tipo de Sensor</h4>
            <p>Los sensores ópticos modernos ofrecen precisión excepcional. Busca DPI ajustables y seguimiento preciso.</p>
            
            <h4>2. Tasa de Polling</h4>
            <p>Una tasa de 1000Hz es estándar para gaming competitivo, asegurando una respuesta rápida.</p>
            
            <h4>3. Ergonomía y Tamaño</h4>
            <p>El mouse debe sentirse cómodo en tu mano. Considera tu estilo de agarre: palma, garra o punta.</p>
            
            <h3>Recomendaciones por Tipo de Juego</h3>
            <ul>
                <li><strong>FPS:</strong> Precisión y sensor de alta calidad</li>
                <li><strong>MOBA/RTS:</strong> Múltiples botones programables</li>
                <li><strong>MMO:</strong> Grid pads o muchos botones laterales</li>
            </ul>
            
            <h3>Conclusión</h3>
            <p>Invertir en un buen mouse gaming es esencial para cualquier jugador serio. Prueba diferentes modelos y encuentra el que mejor se adapte a tu estilo.</p>
        `,
    imagen: "/assets/productos/M1.jpg",
    fecha: "15 Nov 2024",
    autor: "Matias Vega",
    categoria: "Hardware",
    tiempoLectura: "5 min",
    tags: ["Mouse", "Gaming", "Hardware", "Guía", "FPS", "MOBA"],
  },
  {
    id: 2,
    titulo:
      "Los Beneficios de los Teclados Mecánicos para Programadores y Gamers",
    contenido: `
            <h3>¿Por qué Elegir un Teclado Mecánico?</h3>
            <p>Los teclados mecánicos han revolucionado la experiencia de escritura y gaming, ofreciendo ventajas significativas sobre los teclados de membrana tradicionales.</p>
            
            <h3>Ventajas para Programadores</h3>
            <h4>1. Feedback Táctil</h4>
            <p>Los switches táctiles permiten saber cuándo se ha registrado una pulsación, reduciendo errores.</p>
            
            <h4>2. Durabilidad</h4>
            <p>Con una vida útil de 50-100 millones de pulsaciones, son una inversión a largo plazo.</p>
            
            <h4>3. Personalización</h4>
            <p>Keycaps personalizables y macros programables mejoran la productividad.</p>
            
            <h3>Ventajas para Gamers</h3>
            <h4>1. Anti-Ghosting y N-Key Rollover</h4>
            <p>Permiten múltiples pulsaciones simultáneas sin perder comandos.</p>
            
            <h4>2. Tiempos de Respuesta</h4>
            <p>Respuesta más rápida que los teclados de membrana.</p>
            
            <h4>3. Consistencia</h4>
            <p>Cada tecla se siente igual, proporcionando una experiencia uniforme.</p>
            
            <h3>Tipos de Switches</h3>
            <ul>
                <li><strong>Lineales (Red):</strong> Suaves y silenciosos, ideales para gaming</li>
                <li><strong>Táctiles (Brown):</strong> Balance perfecto para trabajo y gaming</li>
                <li><strong>Clicky (Blue):</strong> Feedback auditivo, popular entre mecanógrafos</li>
            </ul>
        `,
    imagen: "/assets/productos/T1.jpg",
    fecha: "10 Nov 2024",
    autor: "Felipe Salazar",
    categoria: "Tecnología",
    tiempoLectura: "7 min",
    tags: ["Teclados", "Mecánico", "Productividad", "Tecnología", "Switches"],
  },
];

export default function BlogDetailPage() {
  const params = useParams();
  const blogId = parseInt(params.id);
  const blog = blogs.find((b) => b.id === blogId);

  if (!blog) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <h2>Blog no encontrado</h2>
          <p>El artículo que buscas no existe.</p>
          <Link href="/blog" className="btn btn-primary">
            Volver al Blog
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      {/* Migas de pan */}
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item linkAs={Link} href="/">
          Home
        </Breadcrumb.Item>
        <Breadcrumb.Item linkAs={Link} href="/blog">
          Blog
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{blog.titulo}</Breadcrumb.Item>
      </Breadcrumb>

      <Row className="justify-content-center">
        <Col lg={8}>
          {/* Header del Blog */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Img
              variant="top"
              src={blog.imagen}
              alt={blog.titulo}
              style={{ height: "400px", objectFit: "cover" }}
              onError={(e) => {
                e.target.src =
                  "https://via.placeholder.com/800x400/007bff/ffffff?text=Blog+Image";
              }}
            />
            <Card.Body className="p-4">
              <div className="mb-3">
                <Badge bg="primary" className="me-2">
                  {blog.categoria}
                </Badge>
                <small className="text-muted">
                  {blog.tiempoLectura} de lectura
                </small>
              </div>

              <h1 className="h2 mb-3">{blog.titulo}</h1>

              <div className="d-flex align-items-center mb-4">
                <div
                  className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: "50px", height: "50px" }}
                >
                  <span className="text-white">👤</span>
                </div>
                <div>
                  <strong>{blog.autor}</strong>
                  <br />
                  <small className="text-muted">{blog.fecha}</small>
                </div>
              </div>

              {/* Tags */}
              <div className="mb-4">
                {blog.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    bg="outline-secondary"
                    text="dark"
                    className="me-2 mb-2"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* Contenido del Blog */}
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <div
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: blog.contenido }}
              />

              {/* Compartir */}
              <div className="mt-5 p-4 bg-light rounded">
                <h5 className="mb-3">¿Te gustó este artículo?</h5>
                <div className="d-flex gap-2">
                  <Button variant="outline-primary" size="sm">
                    👍 Útil
                  </Button>
                  <Button variant="outline-primary" size="sm">
                    🔗 Compartir
                  </Button>
                  <Button variant="outline-primary" size="sm">
                    💬 Comentar
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Navegación */}
          <div className="d-flex justify-content-between mt-4">
            <Link href="/blog" className="btn btn-outline-primary">
              ← Volver al Blog
            </Link>
            <Button
              variant="primary"
              as={Link}
              href={`/blog/${blog.id === 1 ? 2 : 1}`}
            >
              Siguiente Artículo →
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
