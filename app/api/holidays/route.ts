import { NextResponse } from "next/server";

export async function GET() {
  try {
    const year = new Date().getFullYear();

    const response = await fetch(
      `https://date.nager.at/api/v3/PublicHolidays/${year}/CL`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error("Error al obtener feriados");
    }

    const holidays = await response.json();

    const today = new Date().toISOString().split("T")[0];

    const isHoliday = holidays.some((h: any) => h.date === today);

    return NextResponse.json({
      isHoliday,
      today,
      message: isHoliday
        ? "Hoy es feriado, el despacho podría retrasarse"
        : "Hoy no es feriado",
      source: "Nager.Date API",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "No se pudieron obtener los feriados" },
      { status: 500 }
    );
  }
}
