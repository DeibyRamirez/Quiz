import BackButton from "@/components/ui/back-button";
import { ArrowBigLeft, Icon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Política de Privacidad y Tratamiento de Datos | ElectroQuiz",
    description:
        "Política de privacidad y tratamiento de datos personales de ElectroQuiz (complemento de la app C_F_E).",
    robots: { index: true, follow: true },
};

export default function PoliticaPrivacidadPage() {
    const updatedAt = "25 de diciembre de 2025"; // cámbiala cuando actualices el texto

    return (
        <div className="page-shell">
        <main className="page-main max-w-4xl">
            <header className="mb-8">
                <h1 className="heading-primary">
                    Política de Privacidad y Tratamiento de Datos Personales
                </h1>
                <p className="mt-2 caption">
                    Última actualización: <strong>{updatedAt}</strong>
                </p>
                <p className="mt-14 body-text">
                    Esta Política describe cómo <strong>ElectroQuiz</strong> (sitio web) trata los datos
                    personales de sus usuarios. ElectroQuiz es un complemento de la aplicación móvil{" "}
                    <strong>C_F_E</strong> orientada al aprendizaje de Física II (Electromagnetismo).
                </p>
            </header>

            <section className="space-y-8 body-text">
                <section>
                    <h2 className="heading-tertiary">1. Responsable del tratamiento</h2>
                    <ul className="mt-3 list-disc pl-6">
                        <li>
                            Responsable: <strong>ElectroQuiz</strong> (Proyecto académico/educativo)
                        </li>
                        <li>
                            Correo de contacto: <strong>davidurrutiaceron200507@gmail.com</strong>
                        </li>
                        <li>
                            País/Marco aplicable: <strong>Colombia</strong> – Ley 1581 de 2012 y Decreto 1377 de 2013
                            (y demás normas que las modifiquen o sustituyan).
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="heading-tertiary">2. Datos que recopilamos</h2>
                    <p className="mt-3">
                        Dependiendo del uso del sitio, podemos tratar:
                    </p>
                    <ul className="mt-3 list-disc pl-6">
                        <li>
                            <strong>Datos de cuenta</strong>: nombre/alias, correo electrónico, rol (estudiante/docente/administrador),
                            identificadores internos.
                        </li>
                        <li>
                            <strong>Datos académicos</strong>: resultados de quizzes, intentos, respuestas, puntajes, progreso.
                        </li>
                        <li>
                            <strong>Datos técnicos</strong>: IP aproximada, navegador, sistema operativo, eventos de error,
                            identificadores de dispositivo (según configuración).
                        </li>
                        <li>
                            <strong>Cookies/tecnologías similares</strong>: necesarias para sesión/seguridad y (si aplica) medición/anuncios.
                        </li>
                    </ul>
                    <p className="mt-3">
                        ElectroQuiz usa servicios de <strong>Firebase (Google)</strong> como base de datos/autenticación.
                    </p>
                </section>

                <section>
                    <h2 className="heading-tertiary">3. Finalidades del tratamiento</h2>
                    <ul className="mt-3 list-disc pl-6">
                        <li>Crear y administrar cuentas de usuarios y control de acceso por roles.</li>
                        <li>Permitir la creación, asignación, resolución y calificación de quizzes.</li>
                        <li>Generar reportes académicos para docentes/administradores.</li>
                        <li>Soporte técnico, auditoría, seguridad y prevención de fraude/abuso.</li>
                        <li>
                            Medición y mejora del servicio (por ejemplo, analítica de uso), si está habilitada.
                        </li>
                        <li>
                            Mostrar anuncios y gestionar la publicidad conforme a la normativa aplicable
                            y configuraciones de consentimiento.
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="heading-tertiary">4. Base legal y autorización</h2>
                    <p className="mt-3">
                        Al registrarte, iniciar sesión o usar ElectroQuiz, autorizas el tratamiento de tus datos
                        para las finalidades descritas. Cuando sea requerido, solicitaremos consentimiento para cookies
                        no esenciales (p. ej., medición/anuncios).
                    </p>
                </section>

                <section>
                    <h2 className="heading-tertiary">5. Compartición de información y terceros</h2>
                    <p className="mt-3">
                        No vendemos tus datos. Podemos compartir información únicamente en estos casos:
                    </p>
                    <ul className="mt-3 list-disc pl-6">
                        <li>
                            <strong>Proveedores tecnológicos</strong> necesarios para operar el servicio (por ejemplo, Firebase/Google).
                        </li>
                        <li>
                            <strong>Plataformas de anuncios</strong> (si se habilitan), que pueden usar cookies/identificadores
                            para personalización/medición según configuración.
                        </li>
                        <li>
                            <strong>Obligación legal</strong>: cuando una autoridad competente lo requiera.
                        </li>
                        <li>
                            <strong>Protección</strong>: para proteger derechos, seguridad e integridad del servicio y usuarios.
                        </li>
                    </ul>
                </section>

                <section>
                    <h2 className="heading-tertiary">6. Transferencias internacionales</h2>
                    <p className="mt-3">
                        Algunos proveedores (por ejemplo, Google/Firebase) pueden almacenar/procesar datos en servidores
                        fuera de Colombia. Implementamos medidas razonables para que el tratamiento se realice con estándares
                        adecuados de seguridad.
                    </p>
                </section>

                <section>
                    <h2 className="heading-tertiary">7. Conservación de datos</h2>
                    <p className="mt-3">
                        Conservamos los datos mientras exista una relación activa (cuenta habilitada) o mientras sean necesarios
                        para cumplir las finalidades. Puedes solicitar eliminación cuando aplique; ciertos datos pueden mantenerse
                        por obligaciones legales o seguridad.
                    </p>
                </section>

                <section>
                    <h2 className="heading-tertiary">8. Seguridad</h2>
                    <p className="mt-3">
                        Aplicamos medidas técnicas y organizativas razonables: control de acceso, reglas de seguridad (por ejemplo,
                        en Firebase), cifrado en tránsito (HTTPS), y prácticas de mínima exposición. Aun así, ningún sistema es 100%
                        infalible.
                    </p>
                </section>

                <section>
                    <h2 className="heading-tertiary">9. Derechos del titular</h2>
                    <p className="mt-3">
                        Como titular de datos personales (Colombia), puedes ejercer derechos de:
                        acceso, actualización, rectificación, supresión, y revocatoria de autorización (cuando aplique),
                        así como presentar quejas ante la SIC.
                    </p>
                    <p className="mt-3">
                        Para solicitudes escribe a: <strong>davidurrutiaceron200507@gmail.com</strong> indicando:
                        nombre, correo registrado, solicitud concreta y soporte si aplica.
                    </p>
                </section>

                <section>
                    <h2 className="heading-tertiary">10. Menores de edad</h2>
                    <p className="mt-3">
                        Si el uso involucra menores, el tratamiento debe estar autorizado por el representante legal
                        cuando corresponda, y se prioriza el interés superior del menor.
                    </p>
                </section>

                <section>
                    <h2 className="heading-tertiary">11. Cookies, analítica y anuncios</h2>
                    <p className="mt-3">
                        Podemos usar cookies necesarias para autenticación/sesión. Si habilitas analítica o anuncios,
                        pueden usarse cookies adicionales para medición o personalización. Recomendación: implementar
                        un banner de consentimiento (cookies) si usas cookies no esenciales.
                    </p>
                </section>

                <section>
                    <h2 className="heading-tertiary">12. Cambios a esta política</h2>
                    <p className="mt-3">
                        Podemos actualizar esta Política. Publicaremos la versión vigente en esta misma URL e indicaremos la fecha
                        de actualización.
                    </p>
                </section>

                <hr className="my-8" />

                <p className="text-md text-center text-muted-foreground">
                    <BackButton label="Regresar" fallbackHref="/" />
                </p>
            </section>
        </main>
        </div>
    );
}
