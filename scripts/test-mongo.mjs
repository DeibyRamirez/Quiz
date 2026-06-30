import mongoose from "mongoose";

const uri = process.env.MONGODB_URI?.trim();

if (!uri) {
  console.error("❌ MONGODB_URI no está definido.");
  console.error("   En PowerShell: $env:MONGODB_URI='tu_uri'; node scripts/test-mongo.mjs");
  process.exit(1);
}

try {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  const db = mongoose.connection.db;
  await db.command({ ping: 1 });

  console.log("✅ Conexión exitosa a MongoDB");
  console.log(`   Base de datos: ${db.databaseName}`);
  await mongoose.disconnect();
  process.exit(0);
} catch (error) {
  console.error("❌ Error de conexión:", error instanceof Error ? error.message : error);
  process.exit(1);
}
