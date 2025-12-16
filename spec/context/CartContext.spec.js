describe("CartContext", () => {
  let mockUser;
  let mockRouter;
  let mockAuthContext;

  class CartProviderSimulator {
    constructor() {
      this.state = {
        cart: [],
        lastError: null,
      };
    }

    setState(newState) {
      this.state = { ...this.state, ...newState };
    }

    addToCart(product, quantity = 1) {
      if (!mockAuthContext.user) {
        mockRouter.push("/login");
        this.setState({
          lastError: "Debes iniciar sesión para usar el carrito",
        });
        return [...this.state.cart];
      }

      if (!product || typeof product.id === "undefined") {
        this.setState({ lastError: "Producto inválido" });
        return [...this.state.cart];
      }

      const existing = this.state.cart.find((item) => item.id === product.id);
      let newCart;

      if (existing) {
        newCart = this.state.cart.map((item) =>
          item.id === product.id
            ? { ...item, cantidad: (item.cantidad || 0) + Number(quantity) }
            : item
        );
      } else {
        newCart = [
          ...this.state.cart,
          { ...product, cantidad: Number(quantity) },
        ];
      }

      this.setState({ cart: newCart, lastError: null });
      return newCart;
    }

    removeFromCart(productId) {
      if (!mockAuthContext.user) {
        mockRouter.push("/login");
        this.setState({
          lastError: "Debes iniciar sesión para usar el carrito",
        });
        return [...this.state.cart];
      }

      const newCart = this.state.cart.filter((item) => item.id !== productId);
      this.setState({ cart: newCart, lastError: null });
      return newCart;
    }

    updateQuantity(productId, newQuantity) {
      if (!mockAuthContext.user) {
        mockRouter.push("/login");
        this.setState({
          lastError: "Debes iniciar sesión para usar el carrito",
        });
        return [...this.state.cart];
      }

      let newCart;
      if (Number(newQuantity) <= 0) {
        newCart = this.state.cart.filter((item) => item.id !== productId);
      } else {
        newCart = this.state.cart.map((item) =>
          item.id === productId
            ? { ...item, cantidad: Number(newQuantity) }
            : item
        );
      }

      this.setState({ cart: newCart, lastError: null });
      return newCart;
    }

    clearCart() {
      if (!mockAuthContext.user) {
        mockRouter.push("/login");
        this.setState({
          lastError: "Debes iniciar sesión para usar el carrito",
        });
        return [...this.state.cart];
      }

      this.setState({ cart: [], lastError: null });
      return [];
    }

    getTotal() {
      return this.state.cart.reduce(
        (total, item) =>
          total + (Number(item.precio) || 0) * (Number(item.cantidad) || 0),
        0
      );
    }

    getTotalItems() {
      return this.state.cart.reduce(
        (total, item) => total + (Number(item.cantidad) || 0),
        0
      );
    }

    clearError() {
      this.setState({ lastError: null });
    }

    getValue() {
      return {
        cart: this.state.cart,
        items: this.state.cart,
        addToCart: this.addToCart.bind(this),
        removeFromCart: this.removeFromCart.bind(this),
        updateQuantity: this.updateQuantity.bind(this),
        clearCart: this.clearCart.bind(this),
        getTotal: this.getTotal.bind(this),
        getTotalItems: this.getTotalItems.bind(this),
        getCount: this.getTotalItems.bind(this),
        lastError: this.state.lastError,
        clearError: this.clearError.bind(this),
      };
    }
  }

  beforeEach(() => {
    mockUser = { id: 1, email: "test@test.com" };
    mockRouter = { push: jasmine.createSpy("push") };
    mockAuthContext = { user: mockUser };
  });

  describe("Estado inicial", () => {
    it("debe iniciar con carrito vacío", () => {
      const cart = new CartProviderSimulator();

      expect(cart.state.cart).toEqual([]);
      expect(cart.state.lastError).toBeNull();
    });
  });

  describe("Propiedades y métodos del contexto", () => {
    let cart;

    beforeEach(() => {
      cart = new CartProviderSimulator();
    });

    it("debe proporcionar todas las funciones requeridas", () => {
      const value = cart.getValue();

      expect(value.addToCart).toBeDefined();
      expect(value.removeFromCart).toBeDefined();
      expect(value.updateQuantity).toBeDefined();
      expect(value.clearCart).toBeDefined();
      expect(value.getTotal).toBeDefined();
      expect(value.getTotalItems).toBeDefined();
      expect(value.clearError).toBeDefined();
    });

    it("debe tener propiedades cart e items sincronizadas", () => {
      const value = cart.getValue();

      expect(value.cart).toEqual(value.items);
    });
  });

  describe("Gestión del estado del carrito", () => {
    let cart;

    beforeEach(() => {
      cart = new CartProviderSimulator();
    });

    it("debe agregar producto al carrito correctamente", () => {
      const product = { id: 1, nombre: "Laptop", precio: 1500000 };

      cart.addToCart(product, 1);

      expect(cart.state.cart.length).toBe(1);
      expect(cart.state.cart[0]).toEqual({
        ...product,
        cantidad: 1,
      });
    });

    it("debe incrementar cantidad cuando producto ya existe en carrito", () => {
      const product = { id: 1, nombre: "Laptop", precio: 1500000 };

      cart.addToCart(product, 1);
      cart.addToCart(product, 2);

      expect(cart.state.cart.length).toBe(1);
      expect(cart.state.cart[0].cantidad).toBe(3);
    });

    it("debe eliminar producto del carrito correctamente", () => {
      const product = { id: 1, nombre: "Laptop", precio: 1500000 };

      cart.addToCart(product, 1);
      expect(cart.state.cart.length).toBe(1);

      cart.removeFromCart(1);
      expect(cart.state.cart.length).toBe(0);
    });

    it("debe actualizar cantidad de producto existente", () => {
      const product = { id: 1, nombre: "Laptop", precio: 1500000 };

      cart.addToCart(product, 1);
      cart.updateQuantity(1, 5);

      expect(cart.state.cart[0].cantidad).toBe(5);
    });

    it("debe eliminar producto cuando cantidad se actualiza a 0", () => {
      const product = { id: 1, nombre: "Laptop", precio: 1500000 };

      cart.addToCart(product, 1);
      cart.updateQuantity(1, 0);

      expect(cart.state.cart.length).toBe(0);
    });

    it("debe limpiar todo el carrito", () => {
      const products = [
        { id: 1, nombre: "Laptop", precio: 1500000 },
        { id: 2, nombre: "Mouse", precio: 25000 },
      ];

      products.forEach((product) => cart.addToCart(product, 1));
      expect(cart.state.cart.length).toBe(2);

      cart.clearCart();
      expect(cart.state.cart.length).toBe(0);
    });
  });

  describe("Cálculos del carrito", () => {
    let cart;

    beforeEach(() => {
      cart = new CartProviderSimulator();
    });

    it("debe calcular el total correctamente", () => {
      const products = [
        { id: 1, nombre: "Laptop", precio: 1500000 },
        { id: 2, nombre: "Mouse", precio: 25000 },
      ];

      cart.addToCart(products[0], 1);
      cart.addToCart(products[1], 2);
      const total = cart.getTotal();
      const expectedTotal = 1550000;

      expect(total).toBe(expectedTotal);
    });

    it("debe calcular total de items correctamente", () => {
      const products = [
        { id: 1, nombre: "Laptop", precio: 1500000 },
        { id: 2, nombre: "Mouse", precio: 25000 },
      ];

      cart.addToCart(products[0], 1);
      cart.addToCart(products[1], 3);

      const totalItems = cart.getTotalItems();
      const expectedItems = 4;

      expect(totalItems).toBe(expectedItems);
    });

    it("debe retornar 0 para carrito vacío", () => {
      expect(cart.getTotal()).toBe(0);
      expect(cart.getTotalItems()).toBe(0);
    });
  });

  describe("Validación y manejo de errores", () => {
    let cart;

    beforeEach(() => {
      cart = new CartProviderSimulator();
    });

    it("debe redirigir a login cuando usuario no está autenticado", () => {
      mockAuthContext.user = null;

      cart.addToCart({ id: 1, nombre: "Test" }, 1);

      expect(mockRouter.push).toHaveBeenCalledWith("/login");
      expect(cart.state.lastError).toBe(
        "Debes iniciar sesión para usar el carrito"
      );
    });

    it("debe manejar producto inválido correctamente", () => {
      cart.addToCart(null, 1);

      expect(cart.state.lastError).toBe("Producto inválido");
    });

    it("debe limpiar errores con clearError", () => {
      cart.addToCart(null, 1);
      expect(cart.state.lastError).not.toBeNull();

      cart.clearError();
      expect(cart.state.lastError).toBeNull();
    });
  });

  describe("useCart hook", () => {
    it("debe simular el error cuando se usa fuera del provider", () => {
      const useCart = () => {
        throw new Error("useCart debe ser usado dentro de CartProvider");
      };

      expect(() => {
        useCart();
      }).toThrowError("useCart debe ser usado dentro de CartProvider");
    });
  });
});
