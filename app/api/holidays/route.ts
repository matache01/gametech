import { NextResponse } from "next/server";

type Holiday = {
  date: string;
  localName: string;
};

export async function GET() {
  try {
    const year = new Date().getFullYear();
    const today = new Date().toISOString().split("T")[0];

    const res = await fetch(
      `https://date.nager.at/api/v3/PublicHolidays/${year}/CL`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      throw new Error("Error obteniendo feriados");
    }

    const holidays: Holiday[] = await res.json();
    const todayHoliday = holidays.find((h) => h.date === today);

    return NextResponse.json({
      isHoliday: !!todayHoliday,
      message: todayHoliday
        ? `Hoy es feriado: ${todayHoliday.localName}`
        : "Hoy es un día hábil",
    });
  } catch {
    return NextResponse.json(
      { isHoliday: false, message: "No se pudo verificar feriados" },
      { status: 500 }
    );
  }
}
