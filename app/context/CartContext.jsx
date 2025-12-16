"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";

/**
 * CartContext actualizado:
 * - Lee localStorage de forma síncrona en el inicializador de estado para evitar flash.
 * - Mantiene useEffect para cambios posteriores de usuario.
 */

const CartContext = createContext({});

const STORAGE_PREFIX = "cart_";

const getStorageKeyForUser = (user) => {
  if (!user) return `${STORAGE_PREFIX}guest`;
  const id = user.id ?? user.email ?? user.uid ?? user.nombre ?? "unknown";
  return `${STORAGE_PREFIX}${String(id)}`;
};

function inferCategoryFromName(name) {
  if (!name) return "";
  const s = String(name).toLowerCase();
  if (
    /\b(g203|g305|g502|gpro|g pro|mouse|mause|deathadder|mamba|kone)\b/i.test(s)
  )
    return "mouses";
  if (/\b(k552|kuma|teclad|mechanic|mechanical|tenkeyless|tkl)\b/i.test(s))
    return "teclados";
  if (/\b(headset|audifon|auricular|headphone|audifono)\b/i.test(s))
    return "audifonos";
  if (/\b(monitor|ultra|144hz|27")\b/i.test(s)) return "monitores";
  return "";
}

function normalizeCategory(cat) {
  if (!cat) return "";
  const map = {
    monitors: "monitores",
    monitor: "monitores",
    mouse: "mouses",
    mice: "mouses",
    keyboard: "teclados",
    keyboards: "teclados",
    headset: "audifonos",
    headphones: "audifonos",
    audifonos: "audifonos",
    teclados: "teclados",
    mouses: "mouses",
  };
  const s = String(cat).trim();
  return map[s.toLowerCase()] || s;
}

function extractImageToken(product) {
  if (!product) return null;
  const maybe = (v) =>
    v && typeof v === "string" && v.trim() && v !== "null" ? v.trim() : null;
  if (maybe(product.imagen)) return product.imagen.trim();
  if (maybe(product.image)) return product.image.trim();
  if (maybe(product.img)) return product.img.trim();
  // object cases
  const imgObj = product.image ?? product.imagenObj ?? null;
  if (imgObj && typeof imgObj === "object") {
    if (maybe(imgObj.url)) return imgObj.url.trim();
    if (maybe(imgObj.src)) return imgObj.src.trim();
    if (Array.isArray(imgObj) && imgObj[0] && maybe(imgObj[0].url))
      return imgObj[0].url.trim();
  }
  return null;
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const router = useRouter();

  // Inicialización sincrónica desde localStorage (evita flash)
  const initialCart = (() => {
    try {
      const key = getStorageKeyForUser(user);
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      }
    } catch (err) {
      // ignore parse errors
    }
    return [];
  })();

  const [cart, setCart] = useState(initialCart);
  const [isLoaded, setIsLoaded] = useState(true); // ya hicimos la lectura inicial
  const [lastError, setLastError] = useState(null);

  const initKeyRef = useRef(getStorageKeyForUser(user));

  // Effect para responder a cambios de usuario / sincronizar estado si cambia la clave
  useEffect(() => {
    const key = getStorageKeyForUser(user);
    if (initKeyRef.current === key) {
      // ya tenemos la clave actual leída en init
      return;
    }
    initKeyRef.current = key;

    let mounted = true;
    (async () => {
      try {
        const raw =
          typeof window !== "undefined"
            ? window.localStorage.getItem(key)
            : null;
        if (raw) {
          const parsed = JSON.parse(raw);
          if (mounted) setCart(Array.isArray(parsed) ? parsed : []);
        } else {
          if (mounted) setCart([]);
        }
        if (mounted) setLastError(null);
      } catch (err) {
        console.error("Error cargando carrito desde localStorage:", err);
        if (mounted) {
          setCart([]);
          setLastError("Error cargando carrito");
        }
      } finally {
        if (mounted) setIsLoaded(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  // persistir cambios
  useEffect(() => {
    try {
      const key = getStorageKeyForUser(user);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(cart));
      }
    } catch (err) {
      console.error("Error guardando carrito en localStorage:", err);
      setLastError("Error guardando carrito");
    }
  }, [cart, user]);

  const requireAuth = () => {
    if (!user) {
      setLastError("Debes iniciar sesión para usar el carrito");
      try {
        router.push("/login");
      } catch (err) {}
      return false;
    }
    return true;
  };

  const clearError = () => setLastError(null);

  const eqId = (a, b) => String(a ?? "") === String(b ?? "");

  const addToCart = (product, quantity = 1) => {
    clearError();
    if (!requireAuth()) return cart.slice();

    if (
      !product ||
      (typeof product.id === "undefined" &&
        typeof product.productoId === "undefined")
    ) {
      setLastError("Producto inválido");
      return cart.slice();
    }

    const productId = product.id ?? product.productoId;
    const imgToken = extractImageToken(product);

    // obtener categoria preferida del producto (si viene) o inferirla
    const explicitCat =
      product.categoria ?? product.atributo ?? product.category ?? null;
    const categoria =
      normalizeCategory(explicitCat) ||
      inferCategoryFromName(product.nombre ?? product.title ?? "");

    let newCart = [];
    setCart((prev) => {
      const existing = prev.find((i) => eqId(i.id, productId));
      if (existing) {
        newCart = prev.map((i) =>
          eqId(i.id, productId)
            ? { ...i, cantidad: (Number(i.cantidad) || 0) + Number(quantity) }
            : i
        );
      } else {
        const toPush = {
          id: productId,
          nombre: product.nombre ?? product.title ?? product.name ?? "",
          precio: Number(product.precio ?? product.price ?? 0),
          imagen: imgToken ?? null,
          cantidad: Number(quantity),
          categoria: categoria || null,
        };
        newCart = [...prev, toPush];
      }
      return newCart;
    });

    return newCart;
  };

  const addItem = (product, quantity = 1) => addToCart(product, quantity);

  const removeFromCart = (productId) => {
    clearError();
    if (!requireAuth()) return cart.slice();

    let newCart = [];
    setCart((prev) => {
      newCart = prev.filter((i) => !eqId(i.id, productId));
      return newCart;
    });
    return newCart;
  };

  const removeItem = (productId) => removeFromCart(productId);

  const updateQuantity = (productId, newQuantity) => {
    clearError();
    if (!requireAuth()) return cart.slice();

    let newCart = [];
    if (Number(newQuantity) <= 0) {
      setCart((prev) => {
        newCart = prev.filter((i) => !eqId(i.id, productId));
        return newCart;
      });
      return newCart;
    }

    setCart((prev) => {
      newCart = prev.map((i) =>
        eqId(i.id, productId) ? { ...i, cantidad: Number(newQuantity) } : i
      );
      return newCart;
    });
    return newCart;
  };

  const updateQty = (productId, newQuantity) =>
    updateQuantity(productId, newQuantity);

  const clearCart = () => {
    clearError();
    if (!requireAuth()) return cart.slice();

    setCart([]);
    return [];
  };

  const getTotal = () =>
    cart.reduce(
      (acc, it) => acc + Number(it.precio ?? 0) * Number(it.cantidad ?? 0),
      0
    );

  const getTotalItems = () =>
    cart.reduce((acc, it) => acc + (Number(it.cantidad) || 0), 0);

  const getCount = () => getTotalItems();

  const value = {
    cart,
    items: cart,
    addToCart,
    addItem,
    removeFromCart,
    removeItem,
    updateQuantity,
    updateQty,
    clearCart,
    getTotal,
    getTotalItems,
    getCount,
    lastError,
    clearError,
    isLoaded,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context)
    throw new Error("useCart debe ser usado dentro de CartProvider");
  return context;
}
