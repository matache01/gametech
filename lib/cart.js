// lib/cart.js
// Lógica pura del carrito (in-memory). Crear en: <repo-root>/lib/cart.js

let cart = [];

/**
 * Devuelve una copia del carrito actual
 */
export const getCart = () => cart.slice();

/**
 * Reemplaza por completo el carrito en memoria
 * - newCart: array
 */
export const replaceCart = (newCart) => {
  cart = Array.isArray(newCart) ? newCart.map((i) => ({ ...i })) : [];
  return getCart();
};

/**
 * Agrega un producto al carrito.
 * - product: objeto producto completo (id, nombre, precio, ...)
 * - cantidad: número
 */
export const addToCart = (product, cantidad = 1) => {
  if (!product || typeof product.id === "undefined") return getCart();

  const existing = cart.find((i) => i.id === product.id);
  if (existing) {
    existing.cantidad = (existing.cantidad || 0) + cantidad;
  } else {
    cart.push({ ...product, cantidad });
  }
  return getCart();
};

/**
 * Agrega por id usando una lista de productos externa (helper opcional)
 * - productId: id del producto
 * - productos: array de productos (p. ej. import productos from './data/productos.json')
 * - cantidad: número
 */
export const addToCartById = (productId, productos, cantidad = 1) => {
  if (!productos || !Array.isArray(productos)) return getCart();
  const product = productos.find((p) => p.id === productId);
  if (!product) return getCart();
  return addToCart(product, cantidad);
};

export const updateQuantity = (productId, cantidad) => {
  const item = cart.find((i) => i.id === productId);
  if (!item) return getCart();
  item.cantidad = cantidad;
  if (item.cantidad <= 0) {
    cart = cart.filter((i) => i.id !== productId);
  }
  return getCart();
};

export const removeFromCart = (productId) => {
  cart = cart.filter((i) => i.id !== productId);
  return getCart();
};

export const clearCart = () => {
  cart = [];
  return getCart();
};

export const getCartCount = () =>
  cart.reduce((sum, i) => sum + (i.cantidad || 0), 0);
