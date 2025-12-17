// app/lib/assetsClient.js
import { tryHeadThenImage } from "./imageUtils";

const RAW_BASE =
  "https://raw.githubusercontent.com/felipesalazar24/ctrlstore-images/main/products";
const LOCAL_PLACEHOLDER = "/assets/productos/placeholder.png";
const DEFAULT_MAX = 1;
const IN_FLIGHT = new Map();
const CACHE = new Map();
const POSITIVE_TTL_MS = 1000 * 60 * 30;

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
      verify: String(verify),
    });
    if (ext) qs.set("ext", ext);

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
    max = typeof options.max === "number" ? Math.max(1, options.max) : 1;
  } else {
    max = typeof maxOrOptions === "number" ? Math.max(1, maxOrOptions) : 1;
    options = maybeOptions || {};
  }

  if (!nombre) return [LOCAL_PLACEHOLDER];

  const productKey = productCacheKey(nombre, categoria, options);
  const now = Date.now();

  const cached = CACHE.get(productKey);
  if (cached && now - cached.ts < POSITIVE_TTL_MS) {
    return cached.images.length
      ? cached.images.slice(0, max)
      : [LOCAL_PLACEHOLDER];
  }

  if (IN_FLIGHT.has(productKey)) {
    const res = await IN_FLIGHT.get(productKey);
    return res.length ? res.slice(0, max) : [LOCAL_PLACEHOLDER];
  }

  const promise = (async () => {
    try {
      const cat = canonicalCategory(categoria);
      const candidates = await fetchCandidates(nombre, cat, 1);

      if (candidates.length) {
        let url = candidates[0];
        try {
          const u = new URL(url);
          const parts = u.pathname.split("/").filter(Boolean);
          const file = decodeURIComponent(parts.pop() || "");
          const prefix = `${u.protocol}//${u.host}/${parts.join("/")}`;
          url = `${prefix}/${encodeURIComponent(file)}`;
        } catch {
          url = buildRawUrl(cat, url);
        }

        const ok = await tryHeadThenImage(url, 2000);
        CACHE.set(productKey, {
          images: [ok ? url : LOCAL_PLACEHOLDER],
          ts: Date.now(),
          negative: !ok,
        });
        return [ok ? url : LOCAL_PLACEHOLDER];
      }

      const guessed = hasExtension(nombre)
        ? buildRawUrl(cat, nombre)
        : buildRawUrl(cat, `${nombre}.jpg`);

      const guessedOk = await tryHeadThenImage(guessed, 1500);
      CACHE.set(productKey, {
        images: [guessedOk ? guessed : LOCAL_PLACEHOLDER],
        ts: Date.now(),
        negative: !guessedOk,
      });

      return [guessedOk ? guessed : LOCAL_PLACEHOLDER];
    } finally {
      IN_FLIGHT.delete(productKey);
    }
  })();

  IN_FLIGHT.set(productKey, promise);

  try {
    const result = await promise;
    return result.length ? result.slice(0, max) : [LOCAL_PLACEHOLDER];
  } catch {
    CACHE.set(productKey, {
      images: [LOCAL_PLACEHOLDER],
      ts: Date.now(),
      negative: true,
    });
    IN_FLIGHT.delete(productKey);
    return [LOCAL_PLACEHOLDER];
  }
}

export async function getPrimaryImage(nombre, categoria = "", options = {}) {
  const imgs = await getProductImages(nombre, categoria, options);
  return imgs.length ? imgs[0] : LOCAL_PLACEHOLDER;
}

export function setProductAssetMap(map) {
  try {
    if (typeof window !== "undefined") {
      window.PRODUCT_ASSET_MAP = map || {};
    }
  } catch {}
}

export function clearAssetsCache() {
  CACHE.clear();
  IN_FLIGHT.clear();
}
