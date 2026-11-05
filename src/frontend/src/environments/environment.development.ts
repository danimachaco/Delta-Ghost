/**
 * Configuración para desarrollo (`npm start`).
 * Angular sustituye `environment.ts` por este archivo al compilar en desarrollo.
 */
export const environment = {
  produccion: false,
  /**
   * Dirección base de la API REST. Es relativa: el navegador llama a la misma dirección
   * de la web (http://localhost:4200/api…) y `ng serve` la reenvía al backend Spring Boot
   * (http://localhost:8080) según `proxy.conf.json`. Así no hay problemas de CORS aunque
   * la web se abra en otro puerto o desde otra dirección de la red local.
   */
  apiUrl: '/api',
};
