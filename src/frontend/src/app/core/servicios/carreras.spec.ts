import { TestBed } from '@angular/core/testing';
import { Carrera } from '../modelos/carrera';
import { CARRERA_EJEMPLO } from './carrera-ejemplo';
import { CarreraService } from './carreras';

describe('CarreraService', () => {
  let servicio: CarreraService;

  beforeEach(() => {
    servicio = TestBed.inject(CarreraService);
  });

  it('al empezar no hay carrera ni sombra', () => {
    expect(servicio.ultimaCarrera()).toBeNull();
    expect(servicio.sombra()).toBeNull();
  });

  it('una carrera más rápida que la sombra pasa a ser la nueva sombra', () => {
    servicio.finalizar(CARRERA_EJEMPLO);
    expect(servicio.ultimaCarrera()).toBe(CARRERA_EJEMPLO);
    expect(servicio.sombra()).toBe(CARRERA_EJEMPLO);
  });

  it('una carrera más lenta se guarda pero no cambia la sombra', () => {
    const lenta: Carrera = {
      rutaNombre: 'Lenta',
      sectores: [{ indice: 1, tiempoSegundos: 160, sombraSegundos: 150 }],
    };
    servicio.finalizar(lenta);
    expect(servicio.ultimaCarrera()).toBe(lenta);
    expect(servicio.sombra()).toBeNull();
  });
});
