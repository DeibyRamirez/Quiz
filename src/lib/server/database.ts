import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!global.mongooseCache) {
  global.mongooseCache = { conn: null, promise: null };
}

const cached = global.mongooseCache;

function obtenerUriMongo(): string {
  if (!MONGODB_URI?.trim()) {
    throw new Error(
      "MONGODB_URI no está definido. Agrega la variable en .env.local (ver .env.example)."
    );
  }
  return MONGODB_URI.trim();
}

export function estaConectadoMongo(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function conectarDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = obtenerUriMongo();

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    };

    cached.promise = mongoose.connect(uri, opts).then((instance) => instance);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error("Error al conectar a MongoDB:", error);
    throw error;
  }

  return cached.conn;
}

export function obtenerDb() {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error(
      "MongoDB no está conectado. Llama a conectarDB() antes de usar obtenerDb()."
    );
  }

  return db;
}
