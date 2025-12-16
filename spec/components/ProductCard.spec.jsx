describe("ProductCard", () => {
  const mockProducto = {
    id: 1,
    nombre: "Laptop Gamer",
    precio: 1500000,
    imagen: "/laptop.jpg",
  };

  describe("Renderizado correcto", () => {
    it("debe crear una instancia del componente con las props correctas", () => {
      const productCard = new ProductCard({ producto: mockProducto });

      expect(productCard.props.producto).toEqual(mockProducto);
      expect(productCard.props.producto.nombre).toBe("Laptop Gamer");
    });
  });

  describe("Propiedades recibidas", () => {
    it("debe recibir y almacenar correctamente las props", () => {
      const props = { producto: mockProducto };
      const component = new ProductCard(props);

      expect(component.props.producto.nombre).toBe("Laptop Gamer");
      expect(component.props.producto.precio).toBe(1500000);
    });
  });

  describe("Lógica de estado", () => {
    it("debe manejar correctamente la función handleAdd", () => {
      const component = new ProductCard({ producto: mockProducto });

      component.router = { push: jasmine.createSpy("push") };
      component.cartContext = { addToCart: jasmine.createSpy("addToCart") };
      component.authContext = { user: null };

      component.handleAdd();

      expect(component.router.push).toHaveBeenCalledWith("/login");
    });

    it("debe agregar al carrito cuando el usuario está autenticado", () => {
      const component = new ProductCard({ producto: mockProducto });

      component.router = { push: jasmine.createSpy("push") };
      component.cartContext = { addToCart: jasmine.createSpy("addToCart") };
      component.authContext = { user: { id: 1, name: "Test" } };

      spyOn(window, "alert");

      component.handleAdd();

      expect(component.cartContext.addToCart).toHaveBeenCalledWith(
        mockProducto,
        1
      );
      expect(window.alert).toHaveBeenCalledWith(
        "Laptop Gamer agregado al carrito"
      );
    });
  });

  describe("Manejo de eventos", () => {
    it("debe llamar handleAdd cuando se hace click", () => {
      const component = new ProductCard({ producto: mockProducto });
      spyOn(component, "handleAdd");

      component.simulateClick();

      expect(component.handleAdd).toHaveBeenCalled();
    });
  });
});
