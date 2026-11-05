import { Carrera } from '../modelos/carrera';

/**
 * TEMPORAL — carrera de ejemplo de 5 sectores de 500 m. Se usa mientras no
 * exista la lógica real de sectores (sub-tarea 48) ni la API de carreras.
 * Cuando haya datos reales, borra este archivo y sus usos.
 */
export const CARRERA_EJEMPLO: Carrera = {
  rutaNombre: 'Parque (ejemplo)',
  sectores: [
    { indice: 1, tiempoSegundos: 148, sombraSegundos: 150 },
    { indice: 2, tiempoSegundos: 150.6, sombraSegundos: 152 },
    { indice: 3, tiempoSegundos: 158, sombraSegundos: 155 },
    { indice: 4, tiempoSegundos: 150, sombraSegundos: 153 },
    { indice: 5, tiempoSegundos: 157, sombraSegundos: 160 },
  ],
};
