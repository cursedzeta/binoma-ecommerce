import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Autenticacion del administrador.
//
// Un solo usuario, con las credenciales en el .env. No hay tabla de usuarios ni
// registro: el negocio tiene un dueño y el panel es para el. Si algun dia hay
// que dar acceso a otra persona, ahi se agrega la tabla.
//
// La contraseña se guarda HASHEADA en el .env, no en texto plano. Si alguien
// llega a ver ese archivo (una captura de pantalla, un backup, el hombro de al
// lado), no se lleva la contraseña, se lleva un hash inservible.

const DURACION_SESION = "8h";

export type PayloadToken = {
  /** Siempre "admin": es el unico rol que existe. */
  rol: "admin";
  email: string;
};

function getSecreto() {
  const secreto = process.env.JWT_SECRET;

  // Sin secreto no se puede firmar nada. Fallar fuerte es correcto: un panel de
  // administracion que "funciona" sin poder verificar sesiones es peor que uno
  // que no arranca.
  if (!secreto || secreto.length < 32) {
    throw new Error(
      "Falta JWT_SECRET en el .env, o es demasiado corto (mínimo 32 caracteres). " +
        "Generá uno con: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\"",
    );
  }

  return secreto;
}

export function authEstaConfigurada() {
  return Boolean(
    process.env.JWT_SECRET && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH,
  );
}

/**
 * Verifica las credenciales y devuelve un token, o null si no coinciden.
 *
 * Devuelve lo mismo ante email incorrecto y contraseña incorrecta a proposito:
 * si distinguieramos, un atacante podria averiguar que emails existen.
 */
export async function login(email: string, password: string): Promise<string | null> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const hash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminEmail || !hash) {
    throw new Error(
      "Falta ADMIN_EMAIL o ADMIN_PASSWORD_HASH en el .env. Generá el hash con: npm run admin:hash",
    );
  }

  const emailCoincide = email.trim().toLowerCase() === adminEmail.trim().toLowerCase();

  // Comparamos la contraseña SIEMPRE, incluso si el email no coincide, para que
  // la respuesta tarde lo mismo en los dos casos. Si cortaramos antes, el
  // tiempo de respuesta delataria que ese email existe.
  const passwordCoincide = await bcrypt.compare(password, hash);

  if (!emailCoincide || !passwordCoincide) return null;

  const payload: PayloadToken = { rol: "admin", email: adminEmail };

  return jwt.sign(payload, getSecreto(), { expiresIn: DURACION_SESION });
}

/**
 * Devuelve el contenido del token si es valido, o null si esta vencido,
 * adulterado o firmado con otra clave.
 */
export function verificarToken(token: string): PayloadToken | null {
  try {
    const payload = jwt.verify(token, getSecreto());

    if (typeof payload === "string" || payload.rol !== "admin") return null;

    return { rol: "admin", email: String(payload.email ?? "") };
  } catch {
    return null;
  }
}

/** Utilidad para el script que genera el hash al configurar el .env. */
export function hashearPassword(password: string) {
  return bcrypt.hash(password, 12);
}
