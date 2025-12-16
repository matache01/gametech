describe('CheckoutFailedPage', () => {
    // Mocks para las dependencias
    let mockRouter;
    let mockSearchParams;
    let mockSessionStorage;
  
    class CheckoutFailedSimulator {
      constructor() {
        this.state = {
          attempt: null
        };
        this.mounted = true;
      }
  
      setState(newState) {
        this.state = { ...this.state, ...newState };
      }
  
      loadAttemptFromStorage() {
        if (!this.mounted) return;
  
        try {
          const raw = mockSessionStorage.getItem('lastFailedOrder');
          if (raw) {
            const parsed = JSON.parse(raw);
            const orderIdParam = mockSearchParams ? mockSearchParams.get('order') : null;
            
            if (!orderIdParam || parsed.id === orderIdParam) {
              this.setState({ attempt: parsed });
            } else {
              this.setState({ attempt: parsed });
            }
          }
        } catch (err) {
        }
      }
  
      renderContent() {
        if (this.state.attempt) {
          return {
            type: 'with_attempt',
            attempt: this.state.attempt,
            orderId: this.state.attempt.id || (mockSearchParams ? mockSearchParams.get('order') : null) || '—'
          };
        } else {
          return {
            type: 'no_attempt',
            message: 'No se encontró información del intento de pago.'
          };
        }
      }
  
      handleHome() {
        mockRouter.push('/');
      }
  
      handleRetryPayment() {
        mockRouter.push('/checkout');
      }
  
      handleGoToCart() {
        mockRouter.push('/carrito');
      }
  
      calculateItemSubtotal(item) {
        return (Number(item.precio || 0) * Number(item.cantidad || 0)) || 0;
      }
  
      calculateAttemptTotal() {
        if (!this.state.attempt || !Array.isArray(this.state.attempt.items)) return 0;
        
        return this.state.attempt.items.reduce((total, item) => {
          return total + this.calculateItemSubtotal(item);
        }, 0);
      }
  
      cleanup() {
        this.mounted = false;
      }
    }
  
    beforeEach(() => {
      mockRouter = { push: jasmine.createSpy('push') };
      mockSearchParams = { get: jasmine.createSpy('get') };
      mockSessionStorage = {
        getItem: jasmine.createSpy('getItem'),
        setItem: jasmine.createSpy('setItem'),
        removeItem: jasmine.createSpy('removeItem')
      };
    });
  
    describe('Renderizado correcto', () => {
      it('debe mostrar estado de fallo correctamente', () => {
        const failedPage = new CheckoutFailedSimulator();
        const content = failedPage.renderContent();
        
        expect(content.type).toBe('no_attempt');
        expect(content.message).toContain('No se encontró información');
      });
  
      it('debe mostrar información del attempt cuando existe', () => {
        const mockAttempt = {
          id: 'FAIL-123',
          customer: {
            nombre: 'Juan Pérez',
            email: 'juan@test.com',
            telefono: '+56912345678',
            calle: 'Av. Principal 123',
            depto: '45B',
            comuna: 'Santiago',
            region: 'Metropolitana'
          },
          items: [
            {
              id: 1,
              nombre: 'Laptop Gamer',
              precio: 1500000,
              cantidad: 1,
              imagen: '/laptop.jpg'
            }
          ],
          total: 1500000
        };
  
        mockSessionStorage.getItem.and.returnValue(JSON.stringify(mockAttempt));
        
        const failedPage = new CheckoutFailedSimulator();
        failedPage.loadAttemptFromStorage();
        const content = failedPage.renderContent();
        
        expect(content.type).toBe('with_attempt');
        expect(content.attempt.customer.nombre).toBe('Juan Pérez');
        expect(content.orderId).toBe('FAIL-123');
      });
    });
  
    describe('Renderizado condicional', () => {
      it('debe mostrar mensaje cuando no hay attempt en sessionStorage', () => {
        mockSessionStorage.getItem.and.returnValue(null);
        
        const failedPage = new CheckoutFailedSimulator();
        failedPage.loadAttemptFromStorage();
        const content = failedPage.renderContent();
        
        expect(content.type).toBe('no_attempt');
      });
  
      it('debe mostrar attempt aunque el orderId no coincida', () => {
        const mockAttempt = { id: 'FAIL-123', customer: { nombre: 'Test' }, items: [], total: 0 };
        mockSessionStorage.getItem.and.returnValue(JSON.stringify(mockAttempt));
        mockSearchParams.get.and.returnValue('FAIL-999');
        
        const failedPage = new CheckoutFailedSimulator();
        failedPage.loadAttemptFromStorage();
        const content = failedPage.renderContent();

        expect(content.type).toBe('with_attempt');
        expect(content.attempt.customer.nombre).toBe('Test');
      });
  
      it('debe manejar attempt sin items', () => {
        const mockAttempt = {
          id: 'FAIL-123',
          customer: { nombre: 'Test' },
          items: [],
          total: 0
        };
        
        mockSessionStorage.getItem.and.returnValue(JSON.stringify(mockAttempt));
        
        const failedPage = new CheckoutFailedSimulator();
        failedPage.setState({ attempt: mockAttempt });
        const content = failedPage.renderContent();
        
        expect(content.type).toBe('with_attempt');
        expect(content.attempt.items).toEqual([]);
      });
    });
  
    describe('Gestión del estado', () => {
      it('debe cargar attempt desde sessionStorage correctamente', () => {
        const mockAttempt = { id: 'FAIL-123', customer: { nombre: 'Test' }, items: [], total: 0 };
        mockSessionStorage.getItem.and.returnValue(JSON.stringify(mockAttempt));
        
        const failedPage = new CheckoutFailedSimulator();
        failedPage.loadAttemptFromStorage();
        
        expect(mockSessionStorage.getItem).toHaveBeenCalledWith('lastFailedOrder');
        expect(failedPage.state.attempt).toEqual(mockAttempt);
      });
  
      it('debe manejar JSON inválido en sessionStorage', () => {
        mockSessionStorage.getItem.and.returnValue('invalid-json');
        
        const failedPage = new CheckoutFailedSimulator();
        failedPage.loadAttemptFromStorage();
        
        expect(failedPage.state.attempt).toBeNull();
      });
  
      it('debe calcular total del attempt correctamente', () => {
        const mockAttempt = {
          id: 'FAIL-123',
          items: [
            { id: 1, nombre: 'Producto 1', precio: 10000, cantidad: 2 },
            { id: 2, nombre: 'Producto 2', precio: 20000, cantidad: 1 }
          ],
          total: 40000
        };
        
        const failedPage = new CheckoutFailedSimulator();
        failedPage.setState({ attempt: mockAttempt });
        
        const calculatedTotal = failedPage.calculateAttemptTotal();
        expect(calculatedTotal).toBe(40000);
      });
    });
  

    describe('Manejo de eventos', () => {
      it('debe navegar al home cuando se hace click en "Volver al inicio"', () => {
        const failedPage = new CheckoutFailedSimulator();
        
        failedPage.handleHome();
        
        expect(mockRouter.push).toHaveBeenCalledWith('/');
      });
  
      it('debe navegar a checkout cuando se hace click en "Volver a realizar el pago"', () => {
        const failedPage = new CheckoutFailedSimulator();
        
        failedPage.handleRetryPayment();
        
        expect(mockRouter.push).toHaveBeenCalledWith('/checkout');
      });
  
      it('debe navegar al carrito cuando se hace click en "Ir al carrito"', () => {
        const failedPage = new CheckoutFailedSimulator();
        
        failedPage.handleGoToCart();
        
        expect(mockRouter.push).toHaveBeenCalledWith('/carrito');
      });
    });
  
    describe('Cálculos', () => {
      it('debe calcular subtotales por item correctamente', () => {
        const failedPage = new CheckoutFailedSimulator();
        const item = { precio: 15000, cantidad: 3 };
        
        const subtotal = failedPage.calculateItemSubtotal(item);
        expect(subtotal).toBe(45000);
      });
  
      it('debe manejar items sin precio o cantidad', () => {
        const failedPage = new CheckoutFailedSimulator();
        
        const itemSinPrecio = { cantidad: 2 };
        const itemSinCantidad = { precio: 10000 };
        const itemVacio = {};
        
        expect(failedPage.calculateItemSubtotal(itemSinPrecio)).toBe(0);
        expect(failedPage.calculateItemSubtotal(itemSinCantidad)).toBe(0);
        expect(failedPage.calculateItemSubtotal(itemVacio)).toBe(0);
      });
  
      it('debe retornar 0 para attempt sin items', () => {
        const failedPage = new CheckoutFailedSimulator();
        failedPage.setState({ attempt: { items: null } });
        
        const total = failedPage.calculateAttemptTotal();
        expect(total).toBe(0);
      });
    });

    describe('Casos borde', () => {
      it('debe manejar sessionStorage no disponible', () => {
        mockSessionStorage.getItem.and.throwError('Storage not available');
        
        const failedPage = new CheckoutFailedSimulator();

        expect(() => {
          failedPage.loadAttemptFromStorage();
        }).not.toThrow();
        
        expect(failedPage.state.attempt).toBeNull();
      });
  
      it('debe evitar actualizaciones después del cleanup', () => {
        const failedPage = new CheckoutFailedSimulator();
        failedPage.cleanup();

        failedPage.loadAttemptFromStorage();
        expect(failedPage.mounted).toBe(false);
      });
  
      it('debe manejar attempt con items null o undefined', () => {
        const failedPage = new CheckoutFailedSimulator();
        
        failedPage.setState({ attempt: { items: null } });
        expect(failedPage.calculateAttemptTotal()).toBe(0);
        
        failedPage.setState({ attempt: { items: undefined } });
        expect(failedPage.calculateAttemptTotal()).toBe(0);
      });
    });
  });