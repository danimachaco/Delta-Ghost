import { TestBed } from '@angular/core/testing';
import { PantallaEncendida } from './pantalla-encendida';

/** Bloqueo falso que se comporta como el WakeLockSentinel del navegador */
class BloqueoFalso extends EventTarget {
  released = false;
  release = vi.fn(async () => {
    this.released = true;
    this.dispatchEvent(new Event('release'));
  });
}

describe('PantallaEncendida', () => {
  let pantalla: PantallaEncendida;
  let bloqueos: BloqueoFalso[];
  let request: ReturnType<typeof vi.fn>;
  let visibilidad: DocumentVisibilityState;

  /** Pone la API Wake Lock falsa en navigator (o la quita si `con` es false) */
  function ponerApi(con: boolean): void {
    if (con) {
      Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true });
    } else {
      delete (navigator as { wakeLock?: unknown }).wakeLock;
    }
  }

  /** Simula que la pestaña se oculta o vuelve a verse */
  function cambiarVisibilidad(estado: DocumentVisibilityState): void {
    visibilidad = estado;
    document.dispatchEvent(new Event('visibilitychange'));
  }

  beforeEach(() => {
    bloqueos = [];
    request = vi.fn(async () => {
      const bloqueo = new BloqueoFalso();
      bloqueos.push(bloqueo);
      return bloqueo;
    });
    visibilidad = 'visible';
    Object.defineProperty(document, 'visibilityState', {
      get: () => visibilidad,
      configurable: true,
    });
    ponerApi(true);
    pantalla = TestBed.inject(PantallaEncendida);
  });

  afterEach(async () => {
    await pantalla.desactivar();
    ponerApi(false);
  });

  it('empieza apagado y sin pedir nada al navegador', () => {
    expect(pantalla.estado()).toBe('apagado');
    expect(request).not.toHaveBeenCalled();
  });

  it('activar() pide al navegador mantener encendida la pantalla', async () => {
    await pantalla.activar();
    expect(request).toHaveBeenCalledWith('screen');
    expect(pantalla.estado()).toBe('activo');
  });

  it('activar() dos veces solo hace una petición', async () => {
    await pantalla.activar();
    await pantalla.activar();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('desactivar() suelta el bloqueo', async () => {
    await pantalla.activar();
    await pantalla.desactivar();
    expect(bloqueos[0].release).toHaveBeenCalled();
    expect(pantalla.estado()).toBe('apagado');
  });

  it('al volver a la pestaña vuelve a pedir el bloqueo que soltó el navegador', async () => {
    await pantalla.activar();
    // Al ocultar la pestaña el navegador suelta el bloqueo él solo
    cambiarVisibilidad('hidden');
    await bloqueos[0].release();
    expect(pantalla.estado()).toBe('no-disponible');

    cambiarVisibilidad('visible');
    await vi.waitFor(() => expect(pantalla.estado()).toBe('activo'));
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('después de desactivar ya no lo vuelve a pedir al volver a la pestaña', async () => {
    await pantalla.activar();
    await pantalla.desactivar();
    cambiarVisibilidad('visible');
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('si el navegador no tiene la API queda como no disponible, sin errores', async () => {
    ponerApi(false);
    await pantalla.activar();
    expect(pantalla.estado()).toBe('no-disponible');
  });

  it('si el navegador rechaza la petición (batería baja) queda como no disponible', async () => {
    request.mockRejectedValueOnce(new DOMException('Batería baja', 'NotAllowedError'));
    await pantalla.activar();
    expect(pantalla.estado()).toBe('no-disponible');
  });

  it('si se desactiva mientras llega la respuesta, suelta el bloqueo enseguida', async () => {
    const pendiente = pantalla.activar();
    void pantalla.desactivar();
    await pendiente;
    expect(bloqueos[0].release).toHaveBeenCalled();
    expect(pantalla.estado()).toBe('apagado');
  });
});
