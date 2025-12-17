// app/lib/imageUtils.js
// Helper seguro para comprobar imágenes cross-origin sin provocar CORB.
// - tryHeadThenImage(url, timeoutMs): intenta HEAD (no lee body). Si HEAD ok -> true.
//   Si HEAD no ok o falla, intenta cargar con Image() (onload/onerror) y devuelve true/false.
// - No lee el body de respuestas cross-origin.

export async function tryHeadThenImage(url, timeoutMs = 3000) {
  if (!url) return false;
  const u = String(url);

  // 1) HEAD (no lee body)
  try {
    const headRes = await fetch(u, {
      method: "HEAD",
      cache: "no-store",
      mode: "cors",
    });

    if (headRes && headRes.ok) {
      const ct = headRes.headers.get("content-type") || "";
      if (ct.startsWith("image/") || ct.trim() === "") return true;
    }
    // si HEAD no es ok, seguimos a Image()
  } catch {
    // HEAD puede fallar por CORS o red → fallback silencioso
  }

  // 2) Fallback: carga de imagen vía navegador
  return await new Promise((resolve) => {
    let done = false;

    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        resolve(false);
      }
    }, timeoutMs);

    const img = new Image();

    img.onload = () => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve(true);
      }
    };

    img.onerror = () => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve(false);
      }
    };

    try {
      img.src = u;
    } catch {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve(false);
      }
    }
  });
}
