/**
 * Configuración para la versión de producción (`ng build`).
 * Cuando el backend se publique en un servidor, cambiad aquí su dirección.
 */
export const environment = {
  produccion: true,
  /** Dirección base de la API REST (backend Spring Boot) */
  apiUrl: 'http://localhost:8080/api',
};
