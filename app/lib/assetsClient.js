// app/lib/assetsClient.js
// Versión simple (1 llamada /api/assets por producto) integrada con imageUtils.tryHeadThenImage
// - Llama a /api/assets?nombre=...&categoria=...&max=1 como antes.
// - Construye la URL final (filename -> raw URL) or uses returned absolute URL.
// - Verifica de forma segura la URL final con tryHeadThenImage() antes de cachearla y devolverla.
//   Esto evita que el cliente intente leer bodies cross-origin (evita CORB).
// - Si la verificación falla, devolvemos placeholder y cacheamos como negativo.
// - Mantiene IN_FLIGHT + CACHE para evitar múltiples /api/assets por producto.

import { tryHeadThenImage } from "./imageUtils";

const RAW_BASE =
  "https://raw.githubusercontent.com/felipesalazar24/ctrlstore-images/main/products";
const LOCAL_PLACEHOLDER = "/assets/productos/placeholder.png";
const DEFAULT_MAX = 1; // solo pedimos 1 candidato al servidor
const IN_FLIGHT = new Map(); // productKey -> Promise<string[]>
const CACHE = new Map(); // productKey -> { images: string[], ts: number, negative: boolean }
const POSITIVE_TTL_MS = 1000 * 60 * 30; // 30min cache por producto

function canonicalCategory(cat) {
  if (!cat) return "";
  const map = {
    monitors: "monitores",
    monitor: "monitores",
    mouse: "mouses",
    mice: "mouses",
    keyboard: "teclados",
    headphones: "audifonos",
    headset: "audifonos",
  };
  const s = String(cat).trim();
  return map[s.toLowerCase()] || s;
}

function buildRawUrl(category, filename) {
  const catEnc = encodeURIComponent(String(category || "").trim());
  const fileEnc = encodeURIComponent(String(filename || "").trim()).replace(
    /%2F/g,
    "/"
  );
  return `${RAW_BASE}/${catEnc}/${fileEnc}`;
}

function hasExtension(name) {
  return /\.[a-z0-9]{2,5}$/i.test(String(name || "").trim());
}

function productCacheKey(nombre, categoria = "", options = {}) {
  if (options && options.id != null) return `id:${String(options.id)}`;
  return `${canonicalCategory(categoria)}::${String(nombre || "").trim()}`;
}

async function fetchCandidates(
  nombre,
  categoria = "",
  max = DEFAULT_MAX,
  ext = "",
  verify = false
) {
  try {
    const qs = new URLSearchParams({
      nombre: String(nombre || ""),
      categoria: String(categoria || ""),
      max: String(max),
    });
    if (ext) qs.set("ext", ext);
    qs.set("verify", String(verify));
    const res = await fetch(`/api/assets?${qs.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json().catch(() => ({}));
    return Array.isArray(json.images) ? json.images : [];
  } catch {
    return [];
  }
}

/**
 * getProductImages:
 * - Solo una llamada a /api/assets por producto (si no está cacheado).
 * - Verifica la URL final con tryHeadThenImage antes de devolverla.
 * - Si la verificación falla -> devuelve placeholder y cachea negative.
 */
export async function getProductImages(
  nombre,
  categoria = "",
  maxOrOptions = 1,
  maybeOptions = {}
) {
  let max = 1;
  let options = {};
  if (typeof maxOrOptions === "object") {
    options = maxOrOptions || {};
    max =
      typeof options.max === "number"
        ? Math.max(1, Math.min(8, options.max))
        : 1;
  } else {
    max =
      typeof maxOrOptions === "number"
        ? Math.max(1, Math.min(8, maxOrOptions))
        : 1;
    options = maybeOptions || {};
  }

  if (!nombre) return [LOCAL_PLACEHOLDER];

  const productKey = productCacheKey(nombre, categoria, options);
  const now = Date.now();

  // cache lookup
  const cached = CACHE.get(productKey);
  if (cached && now - cached.ts < POSITIVE_TTL_MS) {
    return Array.isArray(cached.images) && cached.images.length
      ? cached.images.slice(0, max)
      : [LOCAL_PLACEHOLDER];
  }

  // reuse inflight
  if (IN_FLIGHT.has(productKey)) {
    try {
      const res = await IN_FLIGHT.get(productKey);
      return Array.isArray(res) && res.length
        ? res.slice(0, max)
        : [LOCAL_PLACEHOLDER];
    } catch {}
  }

  const promise = (async () => {
    try {
      // 1) try manual PRODUCT_ASSET_MAP if present (id priority)
      try {
        const map =
          typeof window !== "undefined" ? window.PRODUCT_ASSET_MAP : undefined;
        if (map && typeof map === "object") {
          if (options && options.id != null && map[options.id]) {
            const arr = Array.isArray(map[options.id])
              ? map[options.id]
              : [map[options.id]];
            const candidateFilename = arr[0];
            const url = buildRawUrl(
              canonicalCategory(categoria),
              candidateFilename
            );
            // verify safely
            const ok = await tryHeadThenImage(url, 2000);
            if (ok) {
              CACHE.set(productKey, {
                images: [url],
                ts: Date.now(),
                negative: false,
              });
              return [url];
            } else {
              CACHE.set(productKey, {
                images: [LOCAL_PLACEHOLDER],
                ts: Date.now(),
                negative: true,
              });
              return [LOCAL_PLACEHOLDER];
            }
          }
          if (map[String(nombre)]) {
            const arr = Array.isArray(map[String(nombre)])
              ? map[String(nombre)]
              : [map[String(nombre)]];
            const candidateFilename = arr[0];
            const url = buildRawUrl(
              canonicalCategory(categoria),
              candidateFilename
            );
            const ok = await tryHeadThenImage(url, 2000);
            if (ok) {
              CACHE.set(productKey, {
                images: [url],
                ts: Date.now(),
                negative: false,
              });
              return [url];
            } else {
              CACHE.set(productKey, {
                images: [LOCAL_PLACEHOLDER],
                ts: Date.now(),
                negative: true,
              });
              return [LOCAL_PLACEHOLDER];
            }
          }
        }
      } catch {
        // ignore map errors and continue
      }

      // 2) SINGLE server call to fetch candidates (no more calls)
      const cat = canonicalCategory(categoria);
      const candidates = await fetchCandidates(nombre, cat, 1, "", false); // SOLO 1 candidato pedido
      if (Array.isArray(candidates) && candidates.length) {
        const first = candidates[0];
        let url = first;
        try {
          // if first is an absolute URL -> normalize last segment
          const u = new URL(first);
          const parts = u.pathname.split("/").filter(Boolean);
          const file = decodeURIComponent(parts.pop() || "");
          const prefixPath = parts.join("/");
          const prefix = `${u.protocol}//${u.host}/${prefixPath}`;
          const encoded = encodeURIComponent(file).replace(/%2F/g, "/");
          url = `${prefix}/${encoded}`;
        } catch {
          // treat as filename -> construct raw URL
          url = buildRawUrl(cat, first);
        }

        // Verify safely before caching to avoid CORB/read-body issues
        const ok = await tryHeadThenImage(url, 2000);
        if (ok) {
          CACHE.set(productKey, {
            images: [url],
            ts: Date.now(),
            negative: false,
          });
          return [url];
        } else {
          // verification failed -> fallback to placeholder (do not attempt other routes)
          CACHE.set(productKey, {
            images: [LOCAL_PLACEHOLDER],
            ts: Date.now(),
            negative: true,
          });
          return [LOCAL_PLACEHOLDER];
        }
      }

      // 3) fallback determinista (no verification to keep behavior simple) -> but to avoid CORB we do NOT fetch/inspect body
      const guessed = hasExtension(nombre)
        ? buildRawUrl(cat, nombre)
        : buildRawUrl(cat, `${nombre}.jpg`);
      // Optionally verify guessed (comment/uncomment): verify may produce 1 HEAD/GET
      const guessedOk = await tryHeadThenImage(guessed, 1500);
      if (guessedOk) {
        CACHE.set(productKey, {
          images: [guessed],
          ts: Date.now(),
          negative: false,
        });
        return [guessed];
      } else {
        CACHE.set(productKey, {
          images: [LOCAL_PLACEHOLDER],
          ts: Date.now(),
          negative: true,
        });
        return [LOCAL_PLACEHOLDER];
      }
    } finally {
      IN_FLIGHT.delete(productKey);
    }
  })();

  IN_FLIGHT.set(productKey, promise);

  try {
    const result = await promise;
    return Array.isArray(result) && result.length
      ? result.slice(0, max)
      : [LOCAL_PLACEHOLDER];
  } catch (err) {
    CACHE.set(productKey, {
      images: [LOCAL_PLACEHOLDER],
      ts: Date.now(),
      negative: true,
    });
    IN_FLIGHT.delete(productKey);
    return [LOCAL_PLACEHOLDER];
  }
}

/* convenience */
export async function getPrimaryImage(nombre, categoria = "", options = {}) {
  if (typeof options === "number") {
    const imgs = await getProductImages(nombre, categoria, options);
    return imgs && imgs.length ? imgs[0] : LOCAL_PLACEHOLDER;
  }
  const imgs = await getProductImages(nombre, categoria, {
    max: options.max || 1,
    id: options.id,
  });
  return imgs && imgs.length ? imgs[0] : LOCAL_PLACEHOLDER;
}

/* allow manual map set */
export function setProductAssetMap(map) {
  try {
    if (typeof window !== "undefined") window.PRODUCT_ASSET_MAP = map || {};
  } catch {}
}

/* clear helper */
export function clearAssetsCache() {
  CACHE.clear();
  IN_FLIGHT.clear();
}
