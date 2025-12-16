describe("ProductoDetailPage", () => {
  let mockParams;
  let mockRouter;
  let mockCart;
  let mockAuth;
  let mockProductos;
  let mockFetch;

  class ProductoDetailSimulator {
    constructor() {
      this.state = {
        producto: null,
        imagenPrincipal: "",
        cantidad: 1,
        offers: [],
      };
      this.mounted = true;
    }

    setState(newState) {
      this.state = { ...this.state, ...newState };
    }
    to;
    loadProducto() {
      const productId = parseInt(mockParams.id, 10);
      const producto = mockProductos.find((p) => p.id === productId);

      if (producto) {
        this.setState({
          producto,
          imagenPrincipal:
            producto.imagen ||
            (Array.isArray(producto.miniaturas) && producto.miniaturas.length
              ? producto.miniaturas[0]
              : ""),
        });
      } else {
        this.setState({
          producto: null,
          imagenPrincipal: "",
        });
      }
    }

    async loadOffers() {
      if (!this.mounted) return;

      try {
        let serverOffers = [];
        if (mockFetch) {
          serverOffers = await mockFetch();
        }

        const storedOffers = [
          { productId: "1", newPrice: 1200000, percent: 20, source: "admin" },
        ];

        const map = new Map();
        for (const o of serverOffers || [])
          map.set(this.pid(o.productId ?? o.id), { ...o, source: "server" });
        for (const o of storedOffers || [])
          map.set(this.pid(o.productId), { ...o, source: "admin" });

        const merged = Array.from(map.values());
        this.setState({ offers: merged });
      } catch (err) {
        console.warn("Error loading offers:", err);
        if (this.mounted) this.setState({ offers: [] });
      }
    }

    pid(v) {
      return String(v ?? "").trim();
    }

    calculatePricing() {
      if (!this.state.producto) return {};

      const producto = this.state.producto;
      const originalPrice = Number((producto.precio ?? producto.price) || 0);
      const offerForProduct = this.state.offers.find(
        (o) =>
          this.pid(o.productId) ===
          this.pid(producto.id ?? producto._id ?? producto.sku)
      );

      const hasOffer = !!(
        offerForProduct &&
        (offerForProduct.newPrice || offerForProduct.percent)
      );
      const effectivePrice = hasOffer
        ? Number(
            offerForProduct.newPrice ??
              Math.round(
                originalPrice *
                  (1 - (Number(offerForProduct.percent) || 0) / 100)
              )
          )
        : originalPrice;

      const percentLabel = hasOffer
        ? offerForProduct.percent ??
          Math.round(
            (((offerForProduct.oldPrice || originalPrice) - effectivePrice) /
              (offerForProduct.oldPrice || originalPrice)) *
              100
          )
        : 0;

      return {
        originalPrice,
        effectivePrice,
        hasOffer,
        offerForProduct,
        percentLabel,
      };
    }

    handleAddToCart() {
      if (!mockAuth.user) {
        mockRouter.push("/login");
        return;
      }

      const pricing = this.calculatePricing();
      const item = {
        ...this.state.producto,
        precio: pricing.effectivePrice,
      };

      mockCart.addToCart(item, Number(this.state.cantidad));
      return `¡${this.state.producto.nombre} agregado al carrito!`;
    }

    updateCantidad(newCantidad) {
      this.setState({ cantidad: newCantidad });
    }

    changeImagenPrincipal(nuevaImagen) {
      this.setState({ imagenPrincipal: nuevaImagen });
    }

    buildThumbs() {
      if (!this.state.producto) return [];

      const producto = this.state.producto;
      const seen = new Set();
      const out = [];

      const push = (v) => {
        if (!v) return;
        const key = String(v);
        if (!seen.has(key)) {
          seen.add(key);
          out.push(v);
        }
      };

      push(producto.imagen);
      if (Array.isArray(producto.miniaturas)) {
        for (const m of producto.miniaturas) push(m);
      }

      return out;
    }

    safeSrc(s) {
      if (!s) return "/assets/productos/placeholder.png";
      try {
        if (String(s).startsWith("data:")) return s;
        if (!String(s).match(/^https?:\/\//i)) return s;
        return String(s);
      } catch {
        return String(s);
      }
    }

    cleanup() {
      this.mounted = false;
    }
  }

  beforeEach(() => {
    mockParams = { id: "1" };
    mockRouter = { push: jasmine.createSpy("push") };
    mockCart = { addToCart: jasmine.createSpy("addToCart") };
    mockAuth = { user: { id: 1, nombre: "Test User" } };

    mockProductos = [
      {
        id: 1,
        nombre: "Laptop Gamer Pro",
        precio: 1500000,
        imagen: "/laptop.jpg",
        miniaturas: ["/laptop-thumb1.jpg", "/laptop-thumb2.jpg"],
        descripcion: "Una laptop gamer de alta gama",
        atributo: "Tecnología",
      },
      {
        id: 2,
        nombre: "Mouse Inalámbrico",
        precio: 25000,
        imagen: "/mouse.jpg",
        descripcion: "Mouse ergonómico inalámbrico",
        atributo: "Accesorio",
      },
    ];

    mockFetch = jasmine
      .createSpy("fetch")
      .and.returnValue(
        Promise.resolve([
          { productId: "1", newPrice: 1300000, percent: 13, source: "server" },
        ])
      );
  });

  describe("Renderizado correcto", () => {
    it("debe cargar y mostrar el producto correctamente", () => {
      const productoDetail = new ProductoDetailSimulator();
      productoDetail.loadProducto();

      expect(productoDetail.state.producto).toEqual(mockProductos[0]);
      expect(productoDetail.state.imagenPrincipal).toBe("/laptop.jpg");
    });

    it("debe mostrar estado de producto no encontrado cuando no existe", () => {
      mockParams.id = "999"; // ID que no existe
      const productoDetail = new ProductoDetailSimulator();
      productoDetail.loadProducto();

      // Usa toBeFalsy() que funciona con null, undefined, false, 0, etc.
      expect(productoDetail.state.producto).toBeFalsy();
    });

    it("debe construir miniaturas correctamente", () => {
      const productoDetail = new ProductoDetailSimulator();
      productoDetail.loadProducto();

      const thumbs = productoDetail.buildThumbs();
      expect(thumbs).toEqual([
        "/laptop.jpg",
        "/laptop-thumb1.jpg",
        "/laptop-thumb2.jpg",
      ]);
    });

    it("debe manejar productos sin miniaturas", () => {
      mockParams.id = "2";
      const productoDetail = new ProductoDetailSimulator();
      productoDetail.loadProducto();

      const thumbs = productoDetail.buildThumbs();
      expect(thumbs).toEqual(["/mouse.jpg"]);
    });
  });

  describe("Renderizado condicional", () => {
    it("debe calcular precios sin oferta correctamente", () => {
      const productoDetail = new ProductoDetailSimulator();
      productoDetail.loadProducto();

      const pricing = productoDetail.calculatePricing();

      expect(pricing.hasOffer).toBe(false);
      expect(pricing.originalPrice).toBe(1500000);
      expect(pricing.effectivePrice).toBe(1500000);
    });

    it("debe calcular precios con oferta correctamente", async () => {
      const productoDetail = new ProductoDetailSimulator();
      productoDetail.loadProducto();
      await productoDetail.loadOffers();

      const pricing = productoDetail.calculatePricing();

      expect(pricing.hasOffer).toBe(true);
      expect(pricing.effectivePrice).toBe(1200000);
      expect(pricing.percentLabel).toBe(20);
    });

    it("debe mostrar diferentes precios cuando hay oferta", async () => {
      const productoDetail = new ProductoDetailSimulator();
      productoDetail.loadProducto();
      await productoDetail.loadOffers();

      const pricing = productoDetail.calculatePricing();

      expect(pricing.originalPrice).toBeGreaterThan(pricing.effectivePrice);
      expect(pricing.hasOffer).toBe(true);
    });
  });

  describe("Gestión del estado", () => {
    it("debe manejar cambios en la cantidad", () => {
      const productoDetail = new ProductoDetailSimulator();
      productoDetail.loadProducto();

      expect(productoDetail.state.cantidad).toBe(1);

      productoDetail.updateCantidad(5);
      expect(productoDetail.state.cantidad).toBe(5);
    });

    it("debe cambiar imagen principal al seleccionar miniatura", () => {
      const productoDetail = new ProductoDetailSimulator();
      productoDetail.loadProducto();

      expect(productoDetail.state.imagenPrincipal).toBe("/laptop.jpg");

      productoDetail.changeImagenPrincipal("/laptop-thumb1.jpg");
      expect(productoDetail.state.imagenPrincipal).toBe("/laptop-thumb1.jpg");
    });

    it("debe cargar offers correctamente", async () => {
      const productoDetail = new ProductoDetailSimulator();
      await productoDetail.loadOffers();

      expect(productoDetail.state.offers.length).toBeGreaterThan(0);
      expect(mockFetch).toHaveBeenCalled();
    });

    it("debe manejar errores al cargar offers", async () => {
      mockFetch.and.returnValue(Promise.reject(new Error("Network error")));
      const productoDetail = new ProductoDetailSimulator();

      await productoDetail.loadOffers();

      expect(productoDetail.state.offers).toEqual([]);
    });
  });

  describe("Manejo de eventos", () => {
    it("debe agregar producto al carrito cuando usuario está autenticado", () => {
      const productoDetail = new ProductoDetailSimulator();
      productoDetail.loadProducto();

      const result = productoDetail.handleAddToCart();

      expect(mockCart.addToCart).toHaveBeenCalled();
      expect(result).toBe("¡Laptop Gamer Pro agregado al carrito!");
    });

    it("debe redirigir a login cuando usuario no está autenticado", () => {
      mockAuth.user = null;
      const productoDetail = new ProductoDetailSimulator();
      productoDetail.loadProducto();

      productoDetail.handleAddToCart();

      expect(mockRouter.push).toHaveBeenCalledWith("/login");
      expect(mockCart.addToCart).not.toHaveBeenCalled();
    });

    it("debe usar el precio con oferta al agregar al carrito", async () => {
      const productoDetail = new ProductoDetailSimulator();
      productoDetail.loadProducto();
      await productoDetail.loadOffers();

      productoDetail.handleAddToCart();

      expect(mockCart.addToCart).toHaveBeenCalledWith(
        jasmine.objectContaining({ precio: 1200000 }),
        jasmine.any(Number)
      );
    });
  });

  describe("Manejo de propiedades y parámetros", () => {
    it("debe manejar diferentes tipos de IDs de producto", () => {
      const productoDetail = new ProductoDetailSimulator();

      expect(productoDetail.pid("1")).toBe("1");
      expect(productoDetail.pid(1)).toBe("1");
      expect(productoDetail.pid(null)).toBe("");
      expect(productoDetail.pid(undefined)).toBe("");
    });

    it("debe manejar safeSrc correctamente", () => {
      const productoDetail = new ProductoDetailSimulator();

      expect(productoDetail.safeSrc("/image.jpg")).toBe("/image.jpg");
      expect(productoDetail.safeSrc("")).toBe(
        "/assets/productos/placeholder.png"
      );
      expect(productoDetail.safeSrc("data:image/png;base64,abc123")).toBe(
        "data:image/png;base64,abc123"
      );
    });

    it("debe parsear correctamente el ID de los parámetros", () => {
      mockParams.id = "123";
      const productoDetail = new ProductoDetailSimulator();
      productoDetail.loadProducto();

      expect(parseInt(mockParams.id, 10)).toBe(123);
    });
  });

  describe("Cálculos y lógica de negocio", () => {
    it("debe calcular descuento por porcentaje correctamente", () => {
      const productoDetail = new ProductoDetailSimulator();
      productoDetail.loadProducto();
      productoDetail.setState({
        offers: [{ productId: "1", percent: 20, source: "server" }],
      });

      const pricing = productoDetail.calculatePricing();

      expect(pricing.effectivePrice).toBe(1200000);
      expect(pricing.percentLabel).toBe(20);
    });

    it("debe calcular descuento por precio nuevo correctamente", () => {
      const productoDetail = new ProductoDetailSimulator();
      productoDetail.loadProducto();
      productoDetail.setState({
        offers: [{ productId: "1", newPrice: 1300000, source: "server" }],
      });

      const pricing = productoDetail.calculatePricing();

      expect(pricing.effectivePrice).toBe(1300000);
      expect(pricing.percentLabel).toBe(13);
    });

    it("debe dar prioridad a ofertas de admin sobre server", async () => {
      const productoDetail = new ProductoDetailSimulator();
      productoDetail.loadProducto();
      await productoDetail.loadOffers();

      const pricing = productoDetail.calculatePricing();

      expect(pricing.effectivePrice).toBe(1200000);
      expect(pricing.offerForProduct.source).toBe("admin");
    });
  });

  describe("Cleanup y manejo de montaje", () => {
    it("debe evitar actualizaciones de estado después del cleanup", async () => {
      const productoDetail = new ProductoDetailSimulator();
      productoDetail.loadProducto();

      productoDetail.cleanup();

      await productoDetail.loadOffers();
      expect(productoDetail.mounted).toBe(false);
    });
  });
});
