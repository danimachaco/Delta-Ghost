/** Usuario de la aplicación (corredor) */
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
}

/** Datos del formulario de inicio de sesión → POST /api/auth/login */
export interface DatosLogin {
  email: string;
  password: string;
}

/** Datos del formulario de registro → POST /api/auth/registro */
export interface DatosRegistro {
  nombre: string;
  email: string;
  password: string;
}

/**
 * Respuesta del backend al iniciar sesión o registrarse.
 * El token se envía después en la cabecera `Authorization: Bearer <token>`.
 */
export interface RespuestaAuth {
  token: string;
  usuario: Usuario;
}
