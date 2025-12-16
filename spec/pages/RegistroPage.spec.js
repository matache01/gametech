describe("RegistroPage", () => {
  // Mocks para las dependencias
  let mockAuth;
  let mockRouter;

  // Datos de prueba para comunas
  const mockComunasPorRegion = {
    Metropolitana: ["Santiago", "Providencia", "Las Condes", "Ñuñoa"],
    Valparaíso: ["Valparaíso", "Viña del Mar", "Quilpué"],
    Biobío: ["Concepción", "Talcahuano", "Chiguayante"],
  };

  // Simulación del componente RegistroPage
  class RegistroPageSimulator {
    constructor() {
      this.state = {
        formData: {
          nombre: "",
          email: "",
          password: "",
          password2: "",
          telefono: "",
          region: "",
          comuna: "",
        },
        errors: {},
        showAlert: false,
        comunas: [],
      };
    }

    setState(newState) {
      this.state = { ...this.state, ...newState };
    }

    // Validaciones
    validarEmail(email) {
      return /^[a-zA-Z0-9._%+-]+@(gmail\.com|duocuc\.cl|profesor\.duoc\.cl)$/i.test(
        email
      );
    }

    validarPassword(pass) {
      if (!pass) return false;
      return pass.length >= 4 && pass.length <= 10;
    }
    validarTelefono(tel) {
      if (!tel || tel.trim() === "") return true;
      const sanitized = tel.replace(/\s+/g, "");
      return /^\+569\d{8}$/.test(sanitized);
    }

    // Manejar cambios en inputs
    handleInputChange(name, value) {
      const newFormData = {
        ...this.state.formData,
        [name]: value,
      };

      // Limpiar error del campo
      const newErrors = { ...this.state.errors };
      if (newErrors[name]) {
        delete newErrors[name];
      }

      // Actualizar comunas cuando cambia la región
      if (name === "region") {
        const nuevasComunas = mockComunasPorRegion[value] || [];
        this.setState({
          formData: { ...newFormData, comuna: "" },
          errors: newErrors,
          comunas: nuevasComunas,
        });
      } else {
        this.setState({
          formData: newFormData,
          errors: newErrors,
        });
      }
    }

    // Validar formulario completo
    validarFormulario() {
      const { formData } = this.state;
      const newErrors = {};

      // Validar nombre
      if (!formData.nombre || !formData.nombre.trim()) {
        newErrors.nombre = "Por favor ingresa tu nombre completo.";
      }

      // Validar email
      if (!formData.email || !formData.email.trim()) {
        newErrors.email = "Por favor ingresa tu correo electrónico.";
      } else if (!this.validarEmail(formData.email.trim())) {
        newErrors.email =
          "Solo se permiten dominios @gmail.com, @duocuc.cl o @profesor.duoc.cl";
      }

      // Validar contraseña
      if (!formData.password) {
        newErrors.password = "Por favor ingresa una contraseña.";
      } else if (!this.validarPassword(formData.password)) {
        newErrors.password =
          "La contraseña debe tener entre 4 y 10 caracteres.";
      }

      // Validar confirmación de contraseña
      if (!formData.password2 || formData.password !== formData.password2) {
        newErrors.password2 = "Las contraseñas no coinciden.";
      }

      // Validar teléfono
      if (!this.validarTelefono(formData.telefono)) {
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

      return newErrors;
    }

    // Manejar envío del formulario
    async handleSubmit() {
      const newErrors = this.validarFormulario();

      if (Object.keys(newErrors).length > 0) {
        this.setState({ errors: newErrors });
        return { success: false, errors: newErrors };
      }

      // Simular registro
      const result = await mockAuth.register({
        nombre: this.state.formData.nombre,
        email: this.state.formData.email,
        password: this.state.formData.password,
        telefono: this.state.formData.telefono,
        region: this.state.formData.region,
        comuna: this.state.formData.comuna,
      });

      if (result.success) {
        this.setState({ showAlert: true });
        return { success: true };
      } else {
        this.setState({ errors: { general: result.message } });
        return { success: false, error: result.message };
      }
    }

    // Simular redirección después de éxito
    simulateRedirect() {
      if (this.state.showAlert) {
        mockRouter.push("/login");
        return true;
      }
      return false;
    }
  }

  beforeEach(() => {
    // Reset mocks antes de cada test
    mockAuth = {
      register: jasmine
        .createSpy("register")
        .and.returnValue(Promise.resolve({ success: true })),
    };
    mockRouter = { push: jasmine.createSpy("push") };
  });

  // 1. PRUEBAS DE RENDERIZADO CORRECTO
  describe("Renderizado correcto", () => {
    it("debe inicializar con estado vacío", () => {
      const registroPage = new RegistroPageSimulator();

      expect(registroPage.state.formData.nombre).toBe("");
      expect(registroPage.state.formData.email).toBe("");
      expect(registroPage.state.formData.password).toBe("");
      expect(registroPage.state.errors).toEqual({});
      expect(registroPage.state.showAlert).toBe(false);
      expect(registroPage.state.comunas).toEqual([]);
    });

    it("debe tener todas las validaciones definidas", () => {
      const registroPage = new RegistroPageSimulator();

      expect(registroPage.validarEmail).toBeDefined();
      expect(registroPage.validarPassword).toBeDefined();
      expect(registroPage.validarTelefono).toBeDefined();
      expect(registroPage.validarFormulario).toBeDefined();
    });
  });

  // 2. PRUEBAS DE VALIDACIÓN DE FORMULARIOS
  describe("Validación de formularios", () => {
    it("debe validar email correctamente", () => {
      const registroPage = new RegistroPageSimulator();

      // Emails válidos
      expect(registroPage.validarEmail("usuario@gmail.com")).toBe(true);
      expect(registroPage.validarEmail("estudiante@duocuc.cl")).toBe(true);
      expect(registroPage.validarEmail("profesor@profesor.duoc.cl")).toBe(true);

      // Emails inválidos
      expect(registroPage.validarEmail("usuario@hotmail.com")).toBe(false);
      expect(registroPage.validarEmail("usuario@yahoo.com")).toBe(false);
      expect(registroPage.validarEmail("email-invalido")).toBe(false);
    });

    it("debe validar contraseña correctamente", () => {
      const registroPage = new RegistroPageSimulator();

      // Contraseñas válidas (4-10 caracteres)
      expect(registroPage.validarPassword("1234")).toBe(true);
      expect(registroPage.validarPassword("1234567890")).toBe(true);
      expect(registroPage.validarPassword("abcd")).toBe(true);

      // Contraseñas inválidas
      expect(registroPage.validarPassword("123")).toBe(false); // Muy corta
      expect(registroPage.validarPassword("12345678901")).toBe(false); // Muy larga
      expect(registroPage.validarPassword("")).toBe(false); // Vacía
      expect(registroPage.validarPassword(null)).toBe(false); // Null
    });

    it("debe validar teléfono correctamente", () => {
      const registroPage = new RegistroPageSimulator();

      // Teléfonos válidos
      expect(registroPage.validarTelefono("+56912345678")).toBe(true);
      expect(registroPage.validarTelefono("+569 1234 5678")).toBe(true);
      expect(registroPage.validarTelefono("")).toBe(true); // Opcional
      expect(registroPage.validarTelefono(null)).toBe(true); // Null - opcional

      // Teléfonos inválidos
      expect(registroPage.validarTelefono("56912345678")).toBe(false); // Sin +
      expect(registroPage.validarTelefono("+5691234567")).toBe(false); // Muy corto
      expect(registroPage.validarTelefono("+569123456789")).toBe(false); // Muy largo
      expect(registroPage.validarTelefono("+569abcd5678")).toBe(false); // Caracteres no numéricos
    });
  });

  // 3. PRUEBAS DE ESTADO
  describe("Gestión del estado", () => {
    it("debe actualizar formData al cambiar inputs", () => {
      const registroPage = new RegistroPageSimulator();

      registroPage.handleInputChange("nombre", "Juan Pérez");
      expect(registroPage.state.formData.nombre).toBe("Juan Pérez");

      registroPage.handleInputChange("email", "juan@test.com");
      expect(registroPage.state.formData.email).toBe("juan@test.com");

      registroPage.handleInputChange("password", "123456");
      expect(registroPage.state.formData.password).toBe("123456");
    });

    it("debe limpiar errores al cambiar inputs", () => {
      const registroPage = new RegistroPageSimulator();
      registroPage.setState({ errors: { nombre: "Error de nombre" } });

      registroPage.handleInputChange("nombre", "Nuevo nombre");

      expect(registroPage.state.errors.nombre).toBeUndefined();
    });

    it("debe actualizar comunas al cambiar región", () => {
      const registroPage = new RegistroPageSimulator();

      registroPage.handleInputChange("region", "Metropolitana");

      expect(registroPage.state.comunas).toEqual([
        "Santiago",
        "Providencia",
        "Las Condes",
        "Ñuñoa",
      ]);
      expect(registroPage.state.formData.comuna).toBe(""); // Debe resetear comuna
    });

    it("debe resetear comuna cuando se cambia región", () => {
      const registroPage = new RegistroPageSimulator();
      registroPage.setState({
        formData: { comuna: "Santiago" },
        comunas: ["Santiago", "Providencia"],
      });

      registroPage.handleInputChange("region", "Valparaíso");

      expect(registroPage.state.formData.comuna).toBe("");
      expect(registroPage.state.comunas).toEqual([
        "Valparaíso",
        "Viña del Mar",
        "Quilpué",
      ]);
    });
  });

  // 4. PRUEBAS DE VALIDACIÓN DE FORMULARIO COMPLETO
  describe("Validación de formulario completo", () => {
    it("debe detectar formulario válido", () => {
      const registroPage = new RegistroPageSimulator();
      registroPage.setState({
        formData: {
          nombre: "Ana García",
          email: "ana@gmail.com",
          password: "123456",
          password2: "123456",
          telefono: "+56912345678",
          region: "Metropolitana",
          comuna: "Santiago",
        },
      });

      const errors = registroPage.validarFormulario();

      expect(Object.keys(errors).length).toBe(0);
    });

    it("debe detectar campos requeridos vacíos", () => {
      const registroPage = new RegistroPageSimulator();
      // Estado vacío por defecto

      const errors = registroPage.validarFormulario();

      expect(errors.nombre).toBeDefined();
      expect(errors.email).toBeDefined();
      expect(errors.password).toBeDefined();
      expect(errors.password2).toBeDefined();
      expect(errors.region).toBeDefined();
      expect(errors.comuna).toBeDefined();
    });

    it("debe detectar email inválido", () => {
      const registroPage = new RegistroPageSimulator();
      registroPage.setState({
        formData: {
          nombre: "Test User",
          email: "ana@hotmail.com", // Dominio no permitido
          password: "123456",
          password2: "123456",
          telefono: "+56912345678",
          region: "Metropolitana",
          comuna: "Santiago",
        },
      });

      const errors = registroPage.validarFormulario();

      expect(errors.email).toContain("Solo se permiten dominios");
    });

    it("debe detectar contraseñas que no coinciden", () => {
      const registroPage = new RegistroPageSimulator();
      registroPage.setState({
        formData: {
          nombre: "Test User",
          email: "test@gmail.com",
          password: "123456",
          password2: "654321", // Diferente
          telefono: "+56912345678",
          region: "Metropolitana",
          comuna: "Santiago",
        },
      });

      const errors = registroPage.validarFormulario();

      expect(errors.password2).toContain("no coinciden");
    });

    it("debe detectar teléfono inválido", () => {
      const registroPage = new RegistroPageSimulator();
      registroPage.setState({
        formData: {
          nombre: "Test User",
          email: "test@gmail.com",
          password: "123456",
          password2: "123456",
          telefono: "12345678", // Formato incorrecto
          region: "Metropolitana",
          comuna: "Santiago",
        },
      });

      const errors = registroPage.validarFormulario();

      expect(errors.telefono).toContain("número válido");
    });
  });

  // 5. PRUEBAS DE EVENTOS
  describe("Manejo de eventos", () => {
    it("debe llamar a register con datos correctos", async () => {
      const registroPage = new RegistroPageSimulator();
      registroPage.setState({
        formData: {
          nombre: "Carlos López",
          email: "carlos@gmail.com",
          password: "123456",
          password2: "123456",
          telefono: "+56987654321",
          region: "Valparaíso",
          comuna: "Viña del Mar",
        },
      });

      await registroPage.handleSubmit();

      expect(mockAuth.register).toHaveBeenCalledWith({
        nombre: "Carlos López",
        email: "carlos@gmail.com",
        password: "123456",
        telefono: "+56987654321",
        region: "Valparaíso",
        comuna: "Viña del Mar",
      });
    });

    it("debe mostrar alerta en registro exitoso", async () => {
      const registroPage = new RegistroPageSimulator();
      registroPage.setState({
        formData: {
          nombre: "Test User",
          email: "test@gmail.com",
          password: "123456",
          password2: "123456",
          telefono: "+56912345678",
          region: "Metropolitana",
          comuna: "Santiago",
        },
      });

      const result = await registroPage.handleSubmit();

      expect(result.success).toBe(true);
      expect(registroPage.state.showAlert).toBe(true);
    });

    it("debe manejar error en registro", async () => {
      mockAuth.register.and.returnValue(
        Promise.resolve({
          success: false,
          message: "Email ya registrado",
        })
      );

      const registroPage = new RegistroPageSimulator();
      registroPage.setState({
        formData: {
          nombre: "Test User",
          email: "existente@gmail.com",
          password: "123456",
          password2: "123456",
          telefono: "+56912345678",
          region: "Metropolitana",
          comuna: "Santiago",
        },
      });

      const result = await registroPage.handleSubmit();

      expect(result.success).toBe(false);
      expect(registroPage.state.errors.general).toBe("Email ya registrado");
    });

    it("debe redirigir a login después de registro exitoso", () => {
      const registroPage = new RegistroPageSimulator();
      registroPage.setState({ showAlert: true });

      const redirected = registroPage.simulateRedirect();

      expect(redirected).toBe(true);
      expect(mockRouter.push).toHaveBeenCalledWith("/login");
    });
  });

  // 6. PRUEBAS DE CASOS BORDE
  describe("Casos borde", () => {
    it("debe manejar región no existente", () => {
      const registroPage = new RegistroPageSimulator();

      registroPage.handleInputChange("region", "RegionInexistente");

      expect(registroPage.state.comunas).toEqual([]);
    });

    it("debe permitir teléfono vacío (opcional)", () => {
      const registroPage = new RegistroPageSimulator();
      registroPage.setState({
        formData: {
          nombre: "Test User",
          email: "test@gmail.com",
          password: "123456",
          password2: "123456",
          telefono: "", // Vacío - debería ser válido
          region: "Metropolitana",
          comuna: "Santiago",
        },
      });

      const errors = registroPage.validarFormulario();

      expect(errors.telefono).toBeUndefined();
    });

    it("debe manejar contraseñas en límites de longitud", () => {
      const registroPage = new RegistroPageSimulator();

      // Límite inferior (4 caracteres)
      expect(registroPage.validarPassword("1234")).toBe(true);

      // Límite superior (10 caracteres)
      expect(registroPage.validarPassword("1234567890")).toBe(true);

      // Un carácter menos (3)
      expect(registroPage.validarPassword("123")).toBe(false);

      // Un carácter más (11)
      expect(registroPage.validarPassword("12345678901")).toBe(false);
    });

    it("debe manejar emails con diferentes casos", () => {
      const registroPage = new RegistroPageSimulator();

      // Mayúsculas y minúsculas - CORREGIDO: ahora usa /i en la regex
      expect(registroPage.validarEmail("Usuario@Gmail.Com")).toBe(true);
      expect(registroPage.validarEmail("ESTUDIANTE@DUOCUC.CL")).toBe(true);
      expect(registroPage.validarEmail("PROFESOR@PROFESOR.DUOC.CL")).toBe(true);
    });
  });

  // 7. PRUEBAS DE INTEGRACIÓN DE CAMPOS
  describe("Integración entre campos", () => {
    it("debe mantener otros campos al cambiar uno", () => {
      const registroPage = new RegistroPageSimulator();
      registroPage.setState({
        formData: {
          nombre: "Juan",
          email: "juan@test.com",
          password: "123456",
          password2: "123456",
          telefono: "+56912345678",
          region: "Metropolitana",
          comuna: "Santiago",
        },
      });

      // Cambiar solo el email
      registroPage.handleInputChange("email", "nuevo@test.com");

      // Verificar que otros campos se mantienen
      expect(registroPage.state.formData.nombre).toBe("Juan");
      expect(registroPage.state.formData.password).toBe("123456");
      expect(registroPage.state.formData.region).toBe("Metropolitana");
      // Solo el email debería cambiar
      expect(registroPage.state.formData.email).toBe("nuevo@test.com");
    });

    it("debe deshabilitar comuna cuando no hay región seleccionada", () => {
      const registroPage = new RegistroPageSimulator();

      // Sin región seleccionada
      expect(registroPage.state.comunas).toEqual([]);
      expect(registroPage.state.formData.comuna).toBe("");

      // Al seleccionar región, debería habilitar comunas
      registroPage.handleInputChange("region", "Biobío");
      expect(registroPage.state.comunas.length).toBeGreaterThan(0);
    });
  });
});
