"use client";

import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
} from "react-bootstrap";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Validaciones básicas
    if (!formData.email.trim()) {
      setErrors({ email: "Por favor ingresa tu correo electrónico." });
      setIsLoading(false);
      return;
    }

    if (!formData.password) {
      setErrors({ password: "Por favor ingresa tu contraseña." });
      setIsLoading(false);
      return;
    }

    try {
      // Llamada a la nueva API unificada para login (busca por email + contrasenia)
      const params = new URLSearchParams({
        email: formData.email,
        contrasenia: formData.password,
      });
      const res = await fetch(`/api/usuario?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg =
          (data && (data.message || data.error)) || "Credenciales inválidas";
        setErrors({ general: msg });
        setIsLoading(false);
        return;
      }

      // backend proxy will return the user object on success
      const user = data;

      if (!user || !user.email) {
        setErrors({
          general: "Usuario no encontrado o credenciales incorrectas.",
        });
        setIsLoading(false);
        return;
      }

      // Try to sync with AuthContext if it exposes a setter
      // (defensive: we don't know exact shape of AuthContext)
      try {
        if (auth) {
          if (typeof auth.setUser === "function") {
            auth.setUser(user);
          } else if (typeof auth.login === "function") {
            // fallback: call login() if available (may trigger its own requests)
            await auth.login(formData.email, formData.password);
          }
        }
      } catch (err) {
        // ignore sync errors, proceed with redirect
        console.warn("No se pudo sincronizar con AuthContext:", err);
      }

      // Informar y redirigir
      if (
        user.rol === "admin" ||
        user.role === "admin" ||
        user.isAdmin === true ||
        (Array.isArray(user.roles) && user.roles.includes("admin"))
      ) {
        alert(`¡Bienvenido administrador ${user.email}!`);
      } else {
        alert("¡Inicio de sesión exitoso!");
      }

      router.push("/");
    } catch (err) {
      console.error(err);
      setErrors({ general: "Error de red al intentar iniciar sesión." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <Card className="shadow border-0">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h1 className="h2 text-primary">Iniciar Sesión</h1>
                <p className="text-muted">Ingresa a tu cuenta</p>
              </div>

              {errors.general && (
                <Alert variant="danger" className="text-center">
                  {errors.general}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                {/* Email */}
                <Form.Group className="mb-3">
                  <Form.Label>Correo Electrónico</Form.Label>
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

                {/* Contraseña */}
                <Form.Group className="mb-3">
                  <Form.Label>Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    isInvalid={!!errors.password}
                    placeholder="Tu contraseña"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
                    type="submit"
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                </div>
              </Form>

              <div className="text-center mt-4">
                <p className="text-muted">
                  ¿No tienes una cuenta?{" "}
                  <Link
                    href="/registro"
                    className="text-primary text-decoration-none"
                  >
                    Regístrate aquí
                  </Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
