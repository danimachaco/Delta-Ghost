/**
 * Configuración para la versión de producción (`ng build`), la que publica Vercel.
 */
export const environment = {
  produccion: true,
  /**
   * Dirección del backend publicado en Render (ver render.yaml y docs/despliegue.md).
   * Si al crear el servicio en Render la dirección es otra, cambiadla aquí.
   * El plan gratis de Render "duerme" el backend tras 15 min sin uso: la primera petición
   * después puede tardar hasta un minuto en responder.
   */
  apiUrl: 'https://ruta-fantasma-api.onrender.com/api',
};
