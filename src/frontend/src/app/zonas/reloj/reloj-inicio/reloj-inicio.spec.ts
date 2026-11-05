import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AvisoSector } from '../../../core/servicios/aviso-sector';
import { Carrera, EstadoCarrera } from '../../../core/servicios/carrera';
import { CarreraService } from '../../../core/servicios/carreras';
import { EstadoPantalla, PantallaEncendida } from '../../../core/servicios/pantalla-encendida';
import { RelojInicio } from './reloj-inicio';

describe('RelojInicio', () => {
  let component: RelojInicio;
  let fixture: ComponentFixture<RelojInicio>;
  let el: HTMLElement;

  /** Carrera falsa: la pantalla solo lee sus signals, así cada prueba pone los datos que quiere */
  const carrera = {
    estado: signal<EstadoCarrera>('en-curso'),
    segundos: signal(754),
    distanciaMetros: signal(2340),
    progresoTu: signal(0.44),
    progresoSombra: signal(0.4),
    diferencia: signal<number | null>(-2.4),
    terminar: vi.fn(),
  };

  /** Bloqueo de pantalla falso (PS-46) */
  const pantalla = { estado: signal<EstadoPantalla>('activo') };

  /** Cambia un input del componente y espera a que se pinte */
  async function poner(nombre: 'progresoTu' | 'progresoSombra', valor: number) {
    fixture.componentRef.setInput(nombre, valor);
    await fixture.whenStable();
  }

  async function actualizar(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    carrera.estado.set('en-curso');
    carrera.segundos.set(754);
    carrera.distanciaMetros.set(2340);
    carrera.progresoTu.set(0.44);
    carrera.progresoSombra.set(0.4);
    carrera.diferencia.set(-2.4);
    carrera.terminar.mockClear();
    pantalla.estado.set('activo');

    await TestBed.configureTestingModule({
      imports: [RelojInicio],
      providers: [
        provideRouter([]),
        { provide: Carrera, useValue: carrera },
        { provide: PantallaEncendida, useValue: pantalla },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RelojInicio);
    component = fixture.componentInstance;
    el = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  it('se crea', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el tiempo de la carrera como mm:ss, los km y la diferencia con la sombra', () => {
    expect(el.querySelector('.tiempo')?.textContent).toBe('12:34');
    expect(el.querySelector('.km')?.textContent).toBe('km 2,3');
    expect(el.querySelector('.diferencia')?.textContent).toBe('-2,4 s');
    expect(el.querySelector('.esfera')?.classList).toContain('mejor');
  });

  it('el tiempo se actualiza en vivo con la carrera', async () => {
    carrera.segundos.set(755);
    await actualizar();
    expect(el.querySelector('.tiempo')?.textContent).toBe('12:35');
  });

  it('pasada una hora muestra también las horas', async () => {
    carrera.segundos.set(3725);
    await actualizar();
    expect(el.querySelector('.tiempo')?.textContent).toBe('1:02:05');
  });

  it('si la sombra va por delante, la diferencia es positiva y la esfera se pone roja', async () => {
    carrera.diferencia.set(1);
    await actualizar();
    expect(el.querySelector('.diferencia')?.textContent).toBe('+1,0 s');
    expect(el.querySelector('.esfera')?.classList).toContain('peor');
    expect(el.querySelector('.esfera')?.classList).not.toContain('mejor');
  });

  it('muestra los dos puntos en la barra, cada uno con su forma', () => {
    expect(el.querySelectorAll('.barra .punto').length).toBe(2);
    expect(el.querySelector('.punto-tu')).toBeTruthy();
    expect(el.querySelector('.punto-sombra')).toBeTruthy();
  });

  it('coloca cada punto según el progreso de la carrera', async () => {
    carrera.progresoTu.set(0.6);
    carrera.progresoSombra.set(0.25);
    await actualizar();
    expect((el.querySelector('.punto-tu') as HTMLElement).style.left).toBe('60%');
    expect((el.querySelector('.punto-sombra') as HTMLElement).style.left).toBe('25%');
  });

  it('los inputs mandan sobre el progreso de la carrera (para una carrera simulada)', async () => {
    await poner('progresoTu', 0.6);
    await poner('progresoSombra', 0.25);
    expect((el.querySelector('.punto-tu') as HTMLElement).style.left).toBe('60%');
    expect((el.querySelector('.punto-sombra') as HTMLElement).style.left).toBe('25%');
  });

  it('el punto de la sombra puede ir por delante del tuyo', async () => {
    await poner('progresoTu', 0.3);
    await poner('progresoSombra', 0.8);
    const tu = parseFloat((el.querySelector('.punto-tu') as HTMLElement).style.left);
    const sombra = parseFloat((el.querySelector('.punto-sombra') as HTMLElement).style.left);
    expect(sombra).toBeGreaterThan(tu);
  });

  it('no deja que un punto se salga de la barra', async () => {
    await poner('progresoTu', 1.7);
    await poner('progresoSombra', -0.5);
    expect((el.querySelector('.punto-tu') as HTMLElement).style.left).toBe('100%');
    expect((el.querySelector('.punto-sombra') as HTMLElement).style.left).toBe('0%');
  });

  it('describe la barra para lectores de pantalla', async () => {
    await poner('progresoTu', 0.5);
    await poner('progresoSombra', 0.4);
    const etiqueta = el.querySelector('.barra')?.getAttribute('aria-label') ?? '';
    expect(etiqueta).toContain('50 %');
    expect(etiqueta).toContain('40 %');
  });

  it('mientras se corre hay botón Terminar y no enlace de salir', () => {
    expect(el.querySelector('.salir')).toBeNull();
    el.querySelector<HTMLButtonElement>('.terminar')!.click();
    expect(carrera.terminar).toHaveBeenCalled();
  });

  it('al terminar deja los datos y permite correr otra vez o salir', async () => {
    carrera.estado.set('terminada');
    await actualizar();
    expect(el.querySelector('.etiqueta')?.textContent).toBe('Carrera terminada');
    expect(el.querySelector('.tiempo')?.textContent).toBe('12:34');
    expect(el.querySelector('.terminar')).toBeNull();
    expect(el.querySelector('a[href="/reloj/elegir"]')).toBeTruthy();
    expect(el.querySelector('.salir')).toBeTruthy();
  });

  it('sin carrera invita a elegir una ruta', async () => {
    carrera.estado.set('sin-carrera');
    carrera.diferencia.set(null);
    await actualizar();
    expect(el.textContent).toContain('Elige una ruta para correr contra tu sombra');
    expect(el.querySelector('a[href="/reloj/elegir"]')).toBeTruthy();
    expect(el.querySelector('.barra')).toBeNull();
    expect(el.querySelector('.esfera')?.classList).not.toContain('mejor');
    expect(el.querySelector('.esfera')?.classList).not.toContain('peor');
  });

  it('si la pantalla se mantiene encendida no muestra ningún aviso', () => {
    expect(el.querySelector('.aviso-pantalla')).toBeNull();
  });

  it('avisa si el navegador no puede mantener la pantalla encendida', async () => {
    pantalla.estado.set('no-disponible');
    await actualizar();
    expect(el.querySelector('.aviso-pantalla')?.textContent).toContain(
      'no puede mantener la pantalla encendida',
    );

    // Al terminar la carrera ya no importa que la pantalla se apague
    carrera.estado.set('terminada');
    await actualizar();
    expect(el.querySelector('.aviso-pantalla')).toBeNull();
  });

  describe('destellos de sector (PS-49)', () => {
    it('no muestra destello si no hay aviso', () => {
      expect(el.querySelector('.destello')).toBeNull();
    });

    it('muestra el destello verde y el rojo según el aviso', async () => {
      const avisos = TestBed.inject(AvisoSector);

      avisos.avisar('mejor');
      await actualizar();
      expect(el.querySelector('.destello-mejor')).not.toBeNull();
      expect(el.querySelector('.destello-peor')).toBeNull();

      avisos.avisar('peor');
      await actualizar();
      expect(el.querySelector('.destello-peor')).not.toBeNull();
      expect(el.querySelector('.destello-mejor')).toBeNull();
    });

    it('los botones de prueba lanzan los avisos', async () => {
      (el.querySelector('.prueba .verde') as HTMLButtonElement).click();
      await actualizar();
      expect(el.querySelector('.destello-mejor')).not.toBeNull();
    });
  });

  describe('resumen (PS-50)', () => {
    it('mientras se corre no se puede abrir el resumen', () => {
      expect(el.querySelector('.finalizar')).toBeNull();
    });

    it('al terminar, Ver resumen guarda la carrera y abre el resumen', async () => {
      carrera.estado.set('terminada');
      await actualizar();
      const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

      (el.querySelector('.finalizar') as HTMLButtonElement).click();

      expect(TestBed.inject(CarreraService).ultimaCarrera()).not.toBeNull();
      expect(navegar).toHaveBeenCalledWith('/app/resumen');
    });
  });
});
