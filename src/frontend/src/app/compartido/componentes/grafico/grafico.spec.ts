import { crearConfiguracion, DatosGrafico } from './grafico';

describe('crearConfiguracion (Chart.js)', () => {
  const base: DatosGrafico = {
    tipo: 'bar',
    etiquetas: ['3 nov', '10 nov'],
    valores: [5.2, 12.4],
    nombreSerie: 'Distancia',
    formato: (valor) => `${valor} km`,
    colores: { serie: '#7c5cff', texto: '#8b949e', rejilla: '#30363d' },
    animar: true,
  };

  it('pasa las etiquetas, los valores y los colores de la app', () => {
    const configuracion = crearConfiguracion(base);
    expect(configuracion.type).toBe('bar');
    expect(configuracion.data.labels).toEqual(['3 nov', '10 nov']);
    expect(configuracion.data.datasets[0].data).toEqual([5.2, 12.4]);
    expect(configuracion.data.datasets[0].backgroundColor).toBe('#7c5cff');
  });

  it('las barras empiezan en 0 y la línea no (para ver bien los cambios de ritmo)', () => {
    const barras = crearConfiguracion(base).options?.scales?.['y'] as { beginAtZero: boolean };
    const linea = crearConfiguracion({ ...base, tipo: 'line' }).options?.scales?.['y'] as {
      beginAtZero: boolean;
    };
    expect(barras.beginAtZero).toBe(true);
    expect(linea.beginAtZero).toBe(false);
  });

  it('el tooltip escribe el valor con el formato de la app', () => {
    const tooltip = crearConfiguracion(base).options?.plugins?.tooltip?.callbacks?.label as (
      c: unknown,
    ) => string;
    expect(tooltip({ parsed: { y: 12.4 } })).toBe('Distancia: 12.4 km');
  });

  it('sin animación si el usuario ha pedido reducir el movimiento', () => {
    expect(crearConfiguracion({ ...base, animar: false }).options?.animation).toBe(false);
    expect(crearConfiguracion(base).options?.animation).toBeUndefined();
  });
});
