/**
 * Error de la API ya "traducido" para mostrarlo en pantalla.
 * Todos los errores HTTP llegan a los componentes con esta forma,
 * gracias al interceptor de errores.
 */
export interface ErrorApi {
  /** Código HTTP (0 si no se pudo conectar con el servidor) */
  estado: number;
  /** Mensaje en español listo para enseñar al usuario */
  mensaje: string;
  /** Errores de validación por campo, p. ej. { nombre: 'El nombre es obligatorio' } */
  errores: Record<string, string>;
}
