## PS-76 · Adaptar la web de estadísticas a la API real

**Autor:** Asier García · **Fecha:** 25/11/2026 · **Issue:** PS-76

### Qué se ha hecho

La web de estadísticas (`/app/estadisticas`) ya usa los datos reales de `GET /api/estadisticas` (PS-75, de Adam), en lugar del formato provisional con el que se programó.

### Cómo se ha hecho

- **Se comparó el JSON.** La pantalla se hizo antes que el endpoint, con un contrato provisional: `{ totales, semanas, carreras }`. Adam implementó otro formato, más completo: `{ resumen, semanas, rutas, evolucion }`. Si se hubiera desplegado el backend sin cambiar el frontend, la pantalla habría salido vacía o con fallos.
- **Modelo y servicio:** las interfaces de `core/modelos/estadisticas.ts` copian el `EstadisticasResponse` del backend. El servicio pide `?semanas=8`, porque dos meses de barras se leen bien en un móvil.
- **Pantalla:**
  - los totales salen de `resumen`, con el ritmo medio que ya calcula el backend;
  - el gráfico de ritmo usa `evolucion.ritmoSegundosKm` (las últimas 20 carreras);
  - la lista enseña las 10 últimas carreras.
- **"Mejor marca":** la API ya no la marca en cada carrera. Se calcula comparando el tiempo de la carrera con el `mejorTiempoSegundos` de su ruta.
- En `CLAUDE.md` el contrato provisional se sustituyó por una nota que remite al contrato real.
- **Pruebas:** usan datos con el formato real. Pasan las 377 y la build no da errores ni avisos.

### Por qué

- **Manda el backend:** es lo que está implementado y probado. El formato de Adam además trae más datos, como el mejor ritmo o la mejora por ruta, que pueden servir para próximos gráficos.

### Problemas encontrados

- Hacer el frontend antes que el backend con un contrato escrito funciona solo si quien hace el backend lo lee antes de empezar. Esta vez los dos se hicieron el mismo día y salieron dos formatos distintos. La próxima vez conviene revisar la PR del backend antes de fusionar la del frontend.
