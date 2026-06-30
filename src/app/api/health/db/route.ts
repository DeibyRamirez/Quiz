import { NextResponse } from "next/server";
import { conectarDB, estaConectadoMongo } from "@/lib/server/database";

export async function GET() {
  try {
    await conectarDB();

    const db = estaConectadoMongo()
      ? (await import("mongoose")).default.connection.db
      : null;

    if (!db) {
      return NextResponse.json(
        { ok: false, error: "Conexión establecida pero sin base de datos activa" },
        { status: 500 }
      );
    }

    await db.command({ ping: 1 });

    return NextResponse.json({
      ok: true,
      database: db.databaseName,
      readyState: (await import("mongoose")).default.connection.readyState,
    });
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error desconocido al conectar";

    return NextResponse.json({ ok: false, error: mensaje }, { status: 500 });
  }
}
