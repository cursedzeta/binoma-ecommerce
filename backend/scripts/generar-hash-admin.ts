import { randomBytes } from "node:crypto";
import { hashearPassword } from "../src/services/auth.service.js";

// Genera los valores que hay que pegar en el .env para el panel de
// administracion.
//
//   npm run admin:hash -- "mi contraseña"
//
// La contraseña nunca se guarda en el .env: se guarda su hash. Si alguien ve
// ese archivo, no puede iniciar sesion con lo que encuentre.

const password = process.argv[2];

if (!password) {
  console.error('Falta la contraseña.\n\n  npm run admin:hash -- "tu contraseña"\n');
  process.exit(1);
}

if (password.length < 10) {
  console.error("La contraseña tiene que tener al menos 10 caracteres.\n");
  process.exit(1);
}

const hash = await hashearPassword(password);
const jwtSecret = randomBytes(48).toString("hex");

console.log("\nPegá estas líneas en backend/.env\n");
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log(`JWT_SECRET=${jwtSecret}`);
console.log("\nY completá tu email:\n");
console.log("ADMIN_EMAIL=tu@email.com");
console.log(
  "\nOjo: si cambiás JWT_SECRET, las sesiones abiertas se invalidan y hay que volver a entrar.\n",
);
