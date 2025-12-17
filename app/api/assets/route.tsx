import { NextResponse } from "next/server";

/**
 * API de Assets (ajustada para priorizar carpetas en minúscula y formas plurales)
 *
 * Cambios principales:
 * - generateCategoryVariants ahora prioriza variantes en minúscula y añade la forma plural
 *   (agrega 's' cuando no termina en 's') para mejorar coincidencia con carpetas como "mouses".
 * - Mantiene las demás características: múltiples baseDirs, patrones file/folder,
 *   candidatos codificados/no codificados, verify=false por defecto.
 *
 * Instrucciones:
 * - Sustituye este archivo y reinicia next dev.
 * - Vuelve a probar la petición /api/assets?nombre=...&categoria=...
 */

type MaybeString = string | null;

const DEFAULT_MAX = 8;
const DEFAULT_EXTS = ["jpg", "png", "jpeg", "webp", "gif"];

const DEFAULT_OWNER = "felipesalazar24";
const DEFAULT_REPO = "ctrlstore-images";
const DEFAULT_BRANCH = "main";
const RAW_BASE = `https://raw.githubusercontent.com/${DEFAULT_OWNER}/${DEFAULT_REPO}/${DEFAULT_BRANCH}`;

// Carpetas base a intentar (asegúrate que son lowercase para preferir rutas correctas)
const BASE_DIRS = ["products", "productos", "producto", "assets", "images"];

/** Sinónimos de categorías (puedes ampliar) */
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  audifonos: [
    "audifonos",
    "audifono",
    "auriculares",
    "auricular",
    "headphones",
    "headset",
  ],
  mouses: ["mouses", "mouse", "ratones", "mice"],
  teclados: ["teclados", "teclado", "keyboard"],
  monitores: ["monitores", "monitor", "screens"],
};

function normalizePreserve(s: unknown): string {
  return String(s ?? "").trim();
}

/** Añade forma plural simple (añadir 's' si no termina en 's') */
function toSimplePlural(s: string): string {
  if (!s) return s;
  if (s.endsWith("s") || s.endsWith("S")) return s;
  return `${s}s`;
}

/** Genera variantes de categoría con prioridad: lowercasePlural, lowercase, original, originalPlural, sinónimos */
function generateCategoryVariants(rawCat: MaybeString): (string | null)[] {
  if (!rawCat) return [null];
  const orig = normalizePreserve(rawCat);
  const lower = orig.toLowerCase();

  const variantsOrdered: Array<string | null> = [];

  // prefer lowercase plural (ej. "mouses")
  const lowerPlural = toSimplePlural(lower);
  variantsOrdered.push(lowerPlural);

  // lowercase singular
  variantsOrdered.push(lower);

  // original exact (respeta mayúsculas y acentos)
  variantsOrdered.push(orig);

  // original plural
  const origPlural = toSimplePlural(orig);
  variantsOrdered.push(origPlural);

  // if synonyms exist for lowercase key, append them (ensure lowercase/plural variants)
  const syns = CATEGORY_SYNONYMS[lower];
  if (Array.isArray(syns)) {
    for (const s of syns) {
      const sTrim = normalizePreserve(s);
      const sLower = sTrim.toLowerCase();
      const sLowerPlural = toSimplePlural(sLower);
      variantsOrdered.push(sLower);
      variantsOrdered.push(sLowerPlural);
      variantsOrdered.push(sTrim);
      variantsOrdered.push(toSimplePlural(sTrim));
    }
  }

  // dedupe while preserving order
  const seen = new Set<string | null>();
  const out: (string | null)[] = [];
  for (const v of variantsOrdered) {
    if (v == null) continue;
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }

  // always include null as a fallback (no category segment)
  out.push(null);

  return out;
}

/** Construye URL; encodedNombre/categoria opcionales */
function buildUrl(
  base: string,
  category: string | null,
  nombre: string,
  i: number,
  ext: string,
  encodedNombre = true,
  encodedCategory = true
) {
  const nameToInsert = encodedNombre ? encodeURIComponent(nombre) : nombre;
  const catToInsert =
    category == null
      ? ""
      : encodedCategory
      ? encodeURIComponent(category)
      : category;

  const fileDirect = `${base}/${catToInsert}/${nameToInsert}(${i}).${ext}`;
  const folderPattern = `${base}/${catToInsert}/${nameToInsert}/${nameToInsert}(${i}).${ext}`;

  return { fileDirect, folderPattern };
}

async function urlExists(url: string): Promise<boolean> {
  try {
    const headRes = await fetch(url, { method: "HEAD" });
    if (headRes && headRes.ok) return true;
    const getRes = await fetch(url, { method: "GET" });
    return Boolean(getRes && getRes.ok);
  } catch {
    return false;
  }
}

function generateCandidates(params: {
  nombre: string;
  categoria: MaybeString;
  baseDirs?: string[];
  exts?: string[];
  maxI?: number;
}) {
  const nombreRaw = params.nombre;
  const categoriaRaw = params.categoria;
  const baseDirs = (params.baseDirs ?? BASE_DIRS).map((d) => d); // already lowercased
  const exts = params.exts ?? DEFAULT_EXTS;
  const maxI = Math.max(1, params.maxI ?? DEFAULT_MAX);

  const catVariants = generateCategoryVariants(categoriaRaw);

  const candidates: string[] = [];

  for (const baseDir of baseDirs) {
    const base = `${RAW_BASE}/${baseDir}`;
    for (let i = 1; i <= maxI; i++) {
      for (const ext of exts) {
        for (const catVar of catVariants) {
          for (const nameVar of [nombreRaw]) {
            // prefer encoded encoded (good for raw.githubusercontent)
            const enc = buildUrl(base, catVar, nameVar, i, ext, true, true);
            candidates.push(enc.fileDirect);
            candidates.push(enc.folderPattern);
            // raw/raw
            const raw = buildUrl(base, catVar, nameVar, i, ext, false, false);
            if (raw.fileDirect !== enc.fileDirect)
              candidates.push(raw.fileDirect);
            if (raw.folderPattern !== enc.folderPattern)
              candidates.push(raw.folderPattern);
            // mixed combinations
            const mix1 = buildUrl(base, catVar, nameVar, i, ext, true, false);
            candidates.push(mix1.fileDirect);
            candidates.push(mix1.folderPattern);
            const mix2 = buildUrl(base, catVar, nameVar, i, ext, false, true);
            candidates.push(mix2.fileDirect);
            candidates.push(mix2.folderPattern);
          }
        }
      }
    }
  }

  // dedupe preserving order
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const c of candidates) {
    if (!seen.has(c)) {
      seen.add(c);
      unique.push(c);
    }
  }
  return unique;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams;
    const nombre = q.get("nombre") || q.get("name") || "";
    if (!nombre)
      return NextResponse.json(
        { error: "Missing 'nombre' parameter" },
        { status: 400 }
      );

    const categoria = (q.get("categoria") ||
      q.get("cat") ||
      null) as MaybeString;
    const max = Math.max(1, Number(q.get("max") || DEFAULT_MAX));
    const extQuery = (q.get("ext") || "").replace(/^\./, "");
    const verify = q.get("verify") === "true";

    const exts = extQuery ? [extQuery] : DEFAULT_EXTS;

    const candidates = generateCandidates({
      nombre: normalizePreserve(nombre),
      categoria,
      baseDirs: BASE_DIRS,
      exts,
      maxI: max,
    });

    if (!verify) {
      const headers: Record<string, string> = {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      };
      return NextResponse.json(
        {
          images: candidates,
          primary: candidates.length ? candidates[0] : null,
          tried: candidates.slice(0, 200),
          patternBase: RAW_BASE,
          baseDirs: BASE_DIRS,
        },
        { status: 200, headers }
      );
    }

    // verify=true -> filter existent ones (puede ser lento)
    const found: string[] = [];
    for (const c of candidates) {
      if (await urlExists(c)) {
        found.push(c);
      }
    }
    const uniqueFound = Array.from(new Set(found));
    const headers: Record<string, string> = {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    };
    return NextResponse.json(
      {
        images: uniqueFound,
        primary: uniqueFound[0] ?? null,
        tried: uniqueFound.slice(0, 200),
        patternBase: RAW_BASE,
      },
      { status: 200, headers }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Internal error", message },
      { status: 500 }
    );
  }
}
