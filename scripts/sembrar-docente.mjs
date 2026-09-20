import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI?.trim();

const DOCENTE_SEMILLA = {
  nombre: "Docente Semilla",
  correo: "docente.semilla@uniautonoma.edu.co",
  contraseñaPlano: "Semilla123",
  rol: "docente",
};

if (!uri) {
  console.error("❌ MONGODB_URI no está definido.");
  console.error(
    "   En PowerShell: $env:MONGODB_URI='tu_uri'; node scripts/sembrar-docente.mjs"
  );
  process.exit(1);
}

try {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  const coleccion = mongoose.connection.db.collection("usuarios");
  const correo = DOCENTE_SEMILLA.correo.toLowerCase();
  const contraseñaHash = await bcrypt.hash(DOCENTE_SEMILLA.contraseñaPlano, 10);

  const existente = await coleccion.findOne({ correo });

  if (existente) {
    await coleccion.updateOne(
      { correo },
      {
        $set: {
          nombre: DOCENTE_SEMILLA.nombre,
          rol: DOCENTE_SEMILLA.rol,
          contraseña: contraseñaHash,
          updatedAt: new Date(),
        },
      }
    );
    console.log("✅ Docente semilla actualizado (contraseña restablecida)");
  } else {
    const ahora = new Date();
    await coleccion.insertOne({
      nombre: DOCENTE_SEMILLA.nombre,
      correo,
      contraseña: contraseñaHash,
      rol: DOCENTE_SEMILLA.rol,
      creadoEn: ahora,
      createdAt: ahora,
      updatedAt: ahora,
    });
    console.log("✅ Docente semilla creado");
  }

  console.log("");
  console.log("   Nombre:     ", DOCENTE_SEMILLA.nombre);
  console.log("   Correo:     ", correo);
  console.log("   Contraseña: ", DOCENTE_SEMILLA.contraseñaPlano);
  console.log("   Rol:        ", DOCENTE_SEMILLA.rol);
  console.log("   Entrar en:  http://localhost:3000/login/");
  console.log("   Panel:      http://localhost:3000/teacher/");
  console.log("   Crear IA:   http://localhost:3000/teacher/create/ia/");

  await mongoose.disconnect();
  process.exit(0);
} catch (error) {
  console.error(
    "❌ Error al sembrar docente:",
    error instanceof Error ? error.message : error
  );
  process.exit(1);
}
