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
import { useRouter } from "next/navigation";

// Diccionario de comunas por región (sin cambios)
const comunasPorRegion = {
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

export default function RegistroPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    password2: "",
    telefono: "",
    region: "",
    comuna: "",
  });

  const [errors, setErrors] = useState({});
  const [showAlert, setShowAlert] = useState(false);
  const [comunas, setComunas] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Validaciones
  const validarEmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@(gmail\.com|duocuc\.cl|profesor\.duoc\.cl)$/.test(
      email
    );
  };

  const validarPassword = (pass) => {
    return pass.length >= 4 && pass.length <= 10;
  };

  const validarTelefono = (tel) => {
    if (tel.trim() === "") return true;
    const sanitized = tel.replace(/\s+/g, "");
    return /^\+569\d{8}$/.test(sanitized);
  };

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

    // Actualizar comunas cuando cambia la región
    if (name === "region") {
      setComunas(comunasPorRegion[value] || []);
      setFormData((prev) => ({
        ...prev,
        comuna: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validar nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = "Por favor ingresa tu nombre completo.";
    }

    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = "Por favor ingresa tu correo electrónico.";
    } else if (!validarEmail(formData.email.trim())) {
      newErrors.email =
        "Solo se permiten dominios @gmail.com, @duocuc.cl o @profesor.duoc.cl";
    }

    // Validar contraseña
    if (!formData.password) {
      newErrors.password = "Por favor ingresa una contraseña.";
    } else if (!validarPassword(formData.password)) {
      newErrors.password = "La contraseña debe tener entre 4 y 10 caracteres.";
    }

    // Validar confirmación de contraseña
    if (!formData.password2 || formData.password !== formData.password2) {
      newErrors.password2 = "Las contraseñas no coinciden.";
    }

    // Validar teléfono
    if (!validarTelefono(formData.telefono)) {
      newErrors.telefono = "Ingresa un número válido (+569 12345678).";
    }

    // Validar región
    if (!formData.region) {
      newErrors.region = "Por favor selecciona una región.";
    }

    // Validar comuna
    if (!formData.comuna) {
      newErrors.comuna = "Por favor selecciona una comuna.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Preparar payload para el backend: backend espera 'contrasenia'
    const payload = {
      nombre: formData.nombre,
      email: formData.email,
      contrasenia: formData.password,
      telefono: formData.telefono
        ? String(formData.telefono).replace(/\s+/g, "")
        : "0",
      region: formData.region,
      comuna: formData.comuna,
      // fechaCreacion y rol serán gestionados por la API unificada si falta
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Intentar extraer mensaje de error
        const data = await res.json().catch(() => null);
        const msg =
          (data && (data.message || data.error)) ||
          `Error al registrar (${res.status})`;
        setErrors({ general: msg });
        setSubmitting(false);
        return;
      }

      // Registro exitoso
      setShowAlert(true);
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrors({ general: "Error de red al intentar registrarse." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow border-0">
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <h1 className="h2 text-primary">Crear Cuenta</h1>
                <p className="text-muted">Regístrate para comenzar a comprar</p>
              </div>

              {showAlert && (
                <Alert variant="success" className="text-center">
                  ✅ Registro exitoso! Redirigiendo al login...
                </Alert>
              )}

              {errors.general && (
                <Alert variant="danger" className="text-center">
                  {errors.general}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                {/* Nombre */}
                <Form.Group className="mb-3">
                  <Form.Label>Nombre Completo *</Form.Label>
                  <Form.Control
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    isInvalid={!!errors.nombre}
                    placeholder="Ingresa tu nombre completo"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.nombre}
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Email */}
                <Form.Group className="mb-3">
                  <Form.Label>Correo Electrónico *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    isInvalid={!!errors.email}
                    placeholder="ejemplo@gmail.com"
                  />
                  <Form.Text className="text-muted">
                    Solo se permiten: @gmail.com, @duocuc.cl, @profesor.duoc.cl
                  </Form.Text>
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Contraseña */}
                <Form.Group className="mb-3">
                  <Form.Label>Contraseña *</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    isInvalid={!!errors.password}
                    placeholder="4-10 caracteres"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Confirmar Contraseña */}
                <Form.Group className="mb-3">
                  <Form.Label>Confirmar Contraseña *</Form.Label>
                  <Form.Control
                    type="password"
                    name="password2"
                    value={formData.password2}
                    onChange={handleInputChange}
                    isInvalid={!!errors.password2}
                    placeholder="Repite tu contraseña"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password2}
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Teléfono */}
                <Form.Group className="mb-3">
                  <Form.Label>Teléfono (Opcional)</Form.Label>
                  <Form.Control
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    isInvalid={!!errors.telefono}
                    placeholder="+569 12345678"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.telefono}
                  </Form.Control.Feedback>
                </Form.Group>

                {/* Región y Comuna */}
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Región *</Form.Label>
                      <Form.Select
                        name="region"
                        value={formData.region}
                        onChange={handleInputChange}
                        isInvalid={!!errors.region}
                      >
                        <option value="">Selecciona una región</option>
                        {Object.keys(comunasPorRegion).map((region) => (
                          <option key={region} value={region}>
                            {region}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.region}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Comuna *</Form.Label>
                      <Form.Select
                        name="comuna"
                        value={formData.comuna}
                        onChange={handleInputChange}
                        isInvalid={!!errors.comuna}
                        disabled={!formData.region}
                      >
                        <option value="">Selecciona una comuna</option>
                        {comunas.map((comuna) => (
                          <option key={comuna} value={comuna}>
                            {comuna}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.comuna}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
                    type="submit"
                    size="lg"
                    disabled={submitting}
                  >
                    {submitting ? "Creando cuenta..." : "Crear Cuenta"}
                  </Button>
                </div>
              </Form>

              <div className="text-center mt-4">
                <p className="text-muted">
                  ¿Ya tienes una cuenta?{" "}
                  <Link
                    href="/login"
                    className="text-primary text-decoration-none"
                  >
                    Inicia sesión aquí
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
