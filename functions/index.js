const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Inicializa Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Función programada: Se ejecuta cada hora y borra sesiones "lobby" > 24h
exports.cleanupLobbySessions = functions.pubsub.schedule("every 1 hours").onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const cutoffTime = new admin.firestore.Timestamp(
        now.seconds - (24 * 60 * 60),  // 24 horas en segundos
        // now.seconds - (5 * 60),  // 5 minutos
        now.nanoseconds
    );

    console.log(`Iniciando limpieza. Corte: ${cutoffTime.toDate()}`);

    try {
        // Consulta sesiones en "lobby" creadas antes del corte
        const sessionsSnapshot = await db
            .collection("sessions")  // ← Tu colección de sesiones
            .where("status", "==", "lobby")
            .where("createdAt", "<=", cutoffTime)
            .get();

        if (sessionsSnapshot.empty) {
            console.log("No hay sesiones para eliminar.");
            return null;
        }

        // Borra en batch (eficiente para muchas sesiones)
        const batch = db.batch();
        let deletedCount = 0;

        sessionsSnapshot.forEach((doc) => {
            batch.delete(doc.ref);
            deletedCount++;
            console.log(`Marcando para borrar: ${doc.id}`);
        });

        await batch.commit();
        console.log(`¡Eliminadas ${deletedCount} sesiones en 'lobby' con más de 24h!`);
        return { message: `Eliminadas ${deletedCount} sesiones` };

    } catch (error) {
        console.error("Error en limpieza de sesiones:", error);
        return null;
    }
});