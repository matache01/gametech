// app/lib/imageUtils.js
// Helper seguro para comprobar imágenes cross-origin sin provocar CORB.
// - tryHeadThenImage(url, timeoutMs): intenta HEAD (no lee body). Si HEAD ok -> true.
//   Si HEAD no ok o falla, intenta cargar con Image() (onload/onerror) y devuelve true/false.
// - No lee el body de respuestas cross-origin.
//
// Uso:
// import { tryHeadThenImage } from './imageUtils';
// const ok = await tryHeadThenImage(url, 2000);

export async function tryHeadThenImage(url, timeoutMs = 3000) {
  if (!url) return false;
  const u = String(url);

  // 1) HEAD (no lee body) — muchos hosts soportan HEAD y evita CORB
  try {
    const headRes = await fetch(u, {
      method: "HEAD",
      cache: "no-store",
      mode: "cors",
    });
    if (headRes && headRes.ok) {
      const ct = headRes.headers.get("content-type") || "";
      // if content-type looks like an image, accept it
      if (ct.startsWith("image/") || ct.trim() === "") return true;
      // otherwise fallthrough to Image() attempt (some servers return empty content-type)
    }
    // If HEAD returns non-ok, continue to Image() attempt — some servers don't handle HEAD.
  } catch (e) {
    // HEAD can fail due to CORS or network — silently fall back to Image()
  }

  // 2) Fallback: load via browser image request (this triggers normal <img> GET; JS doesn't read body)
  return await new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        resolve(false);
      }
    }, timeoutMs);

    const img = new Image();
    img.onload = function () {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve(true);
      }
    };
    img.onerror = function () {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve(false);
      }
    };
    // Start the request
    try {
      // Append tiny cache-buster to avoid being satisfied by stale caches during debug; harmless otherwise.
      img.src = u;
    } catch (e) {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve(false);
      }
    }
  });
}
