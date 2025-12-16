"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

async function safeParseResponse(res) {
  // Try to parse JSON only if content-type is JSON, otherwise return text
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      // malformed json
      const txt = await res.text().catch(() => "");
      return { ok: res.ok, status: res.status, data: txt || null };
    }
  } else {
    // Not JSON (likely HTML error page) — return text to help debug and avoid JSON.parse errors
    const text = await res.text().catch(() => "");
    return { ok: res.ok, status: res.status, data: text || null };
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();

  // Helper that persists user to localStorage and state
  const saveUser = (u) => {
    setUser(u);
    try {
      if (typeof window !== "undefined") {
        if (u === null) {
          localStorage.removeItem("user");
        } else {
          localStorage.setItem("user", JSON.stringify(u));
        }
      }
    } catch (e) {
      console.error("AuthContext: error writing localStorage", e);
    }
  };

  // Verify stored user against backend. This avoids parsing HTML error pages and keeps the session accurate.
  const verifyUser = async (storedUser) => {
    if (!storedUser) {
      saveUser(null);
      return null;
    }

    try {
      // Prefer lookup by id if available
      if (storedUser.id || storedUser._id) {
        const id = storedUser.id ?? storedUser._id;
        const res = await fetch(`/api/usuario?id=${encodeURIComponent(id)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const parsed = await safeParseResponse(res);
        if (!parsed.ok) {
          // invalid session or resource not found
          saveUser(null);
          return null;
        }
        // parsed.data may be object or text; ensure it's an object
        if (parsed.data && typeof parsed.data === "object") {
          saveUser(parsed.data);
          return parsed.data;
        } else {
          saveUser(null);
          return null;
        }
      }

      // If no id, try to find by email: fetch all users and match email (backend has no dedicated GET by email)
      if (storedUser.email) {
        const res = await fetch("/api/usuario", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const parsed = await safeParseResponse(res);
        if (!parsed.ok) {
          saveUser(null);
          return null;
        }
        const list = Array.isArray(parsed.data) ? parsed.data : [];
        const found = list.find(
          (u) =>
            String(u.email).toLowerCase() ===
            String(storedUser.email).toLowerCase()
        );
        if (found) {
          saveUser(found);
          return found;
        } else {
          saveUser(null);
          return null;
        }
      }

      // fallback: clear
      saveUser(null);
      return null;
    } catch (err) {
      console.error("verifyUser error", err);
      saveUser(null);
      return null;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const raw =
          typeof window !== "undefined" ? localStorage.getItem("user") : null;
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            // verify against backend to avoid using stale or invalid session
            await verifyUser(parsed);
          } catch (e) {
            console.error("AuthContext: error parsing stored user", e);
            saveUser(null);
          }
        } else {
          saveUser(null);
        }
      } catch (e) {
        console.error("AuthContext: error reading localStorage", e);
        saveUser(null);
      } finally {
        setHydrated(true);
      }
    })();
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    try {
      // The unified API exposes GET ?email=..&contrasenia=.. to find a user (we proxy that)
      const params = new URLSearchParams({ email, contrasenia: password });
      const res = await fetch(`/api/usuario?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const parsed = await safeParseResponse(res);

      if (!parsed.ok) {
        // parsed.data may be a string (HTML) or an object; pick helpful message
        const msg =
          parsed.data && typeof parsed.data === "object"
            ? parsed.data.message || parsed.data.error
            : parsed.data || `Error ${parsed.status}`;
        return { success: false, message: msg || "Error al iniciar sesión" };
      }

      const userData = parsed.data;

      if (!userData || typeof userData !== "object") {
        return { success: false, message: "Respuesta inesperada del servidor" };
      }

      saveUser(userData);
      return {
        success: true,
        isAdmin: userData.rol === "admin" || userData.role === "admin",
        user: userData,
      };
    } catch (err) {
      console.error("AuthContext login error", err);
      return { success: false, message: "Error de red" };
    }
  };

  const register = async (payload) => {
    try {
      // New unified API: POST /api/usuario
      const res = await fetch("/api/usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const parsed = await safeParseResponse(res);

      if (!parsed.ok) {
        const msg =
          parsed.data && typeof parsed.data === "object"
            ? parsed.data.message || parsed.data.error
            : parsed.data || `Error ${parsed.status}`;
        return { success: false, message: msg || "Error al registrar" };
      }

      const created = parsed.data;
      // Optionally, auto-login the created user by saving (comment/uncomment as desired)
      // saveUser(created);

      return { success: true, user: created };
    } catch (err) {
      console.error("AuthContext register error", err);
      return { success: false, message: "Error de red" };
    }
  };

  const logout = () => {
    saveUser(null);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
      }
    } catch (e) {
      console.error("AuthContext: error cleaning localStorage", e);
    }
    router.push("/");
  };

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, hydrated, setUser: saveUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// useAuth tolerante: no lanza si falta provider, devuelve una API segura
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Fallback seguro si el provider no está presente
    return {
      user: null,
      login: async () => ({
        success: false,
        message: "Auth provider no disponible",
      }),
      register: async () => ({
        success: false,
        message: "Auth provider no disponible",
      }),
      logout: () => {},
      hydrated: true,
      setUser: () => {},
    };
  }
  return ctx;
}
