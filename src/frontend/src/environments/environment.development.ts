/**
 * Configuración para desarrollo (`npm start`).
 * Angular sustituye `environment.ts` por este archivo al compilar en desarrollo.
 */
export const environment = {
  produccion: false,
  /** Dirección base de la API REST (backend Spring Boot en local) */
  apiUrl: 'http://localhost:8080/api',
};
