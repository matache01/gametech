import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");

  if (!city) {
    return NextResponse.json({ error: "Ciudad requerida" }, { status: 400 });
  }

  try {
    const url = `https://api.meteored.cl/index.php?api_lang=cl&localidad=${encodeURIComponent(
      city
    )}&affiliate_id=${process.env.METEORED_API_KEY}`;

    console.log("METEORED KEY:", process.env.METEORED_API_KEY?.length);

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("Error Meteored");

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "No se pudo obtener el clima" },
      { status: 500 }
    );
  }
}
