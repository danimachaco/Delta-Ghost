import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { erroresInterceptor } from '../../../core/interceptores/errores-interceptor';
import { Amistad, Solicitudes } from '../../../core/modelos/amigo';
import { AmigosPantalla } from './amigos';

/** Amistad de ejemplo con otro corredor */
function amistad(id: string, nombre: string, estado: Amistad['estado'] = 'ACEPTADA'): Amistad {
  return {
    id,
    usuario: { id: `u${id}`, nombre, email: `${nombre.toLowerCase()}@correo.com` },
    estado,
    fecha: '2026-11-05T10:00:00',
  };
}

describe('AmigosPantalla', () => {
  let fixture: ComponentFixture<AmigosPantalla>;
  let el: HTMLElement;
  let servidor: HttpTestingController;
  const base = `${environment.apiUrl}/amigos`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmigosPantalla],
      providers: [
        provideHttpClient(withInterceptors([erroresInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AmigosPantalla);
    el = fixture.nativeElement;
    servidor = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => servidor.verify());

  async function refrescar() {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  /** Responde a la carga inicial: amigos y solicitudes */
  async function cargar(
    amigos: Amistad[],
    solicitudes: Solicitudes = { recibidas: [], enviadas: [] },
  ) {
    servidor.expectOne(base).flush(amigos);
    servidor.expectOne(`${base}/solicitudes`).flush(solicitudes);
    await refrescar();
  }

  async function escribirEmailYEnviar(email: string) {
    const input = el.querySelector<HTMLInputElement>('#email-amigo')!;
    input.value = email;
    input.dispatchEvent(new Event('input'));
    el.querySelector<HTMLButtonElement>('form button')!.click();
    await refrescar();
  }

  it('muestra los esqueletos mientras carga', async () => {
    expect(el.querySelectorAll('.esqueleto').length).toBe(3);
    await cargar([]);
  });

  it('pinta la lista de amigos', async () => {
    await cargar([amistad('1', 'Luis'), amistad('2', 'Eva')]);
    const amigos = el.querySelectorAll('.amigo');
    expect(amigos.length).toBe(2);
    expect(amigos[0].querySelector('.nombre')?.textContent).toBe('Luis');
    expect(amigos[0].querySelector('.detalle')?.textContent).toContain('5 nov 2026');
  });

  it('si no tiene amigos explica cómo añadirlos', async () => {
    await cargar([]);
    expect(el.textContent).toContain('Todavía no tienes amigos');
    expect(el.querySelector('.recibida')).toBeNull();
  });

  it('acepta una solicitud recibida y la pasa a la lista de amigos', async () => {
    await cargar([], { recibidas: [amistad('5', 'Eva', 'PENDIENTE')], enviadas: [] });
    const boton = el.querySelector<HTMLButtonElement>('.recibida button')!;
    expect(boton.getAttribute('aria-label')).toBe('Aceptar a Eva');

    boton.click();
    await refrescar();
    expect(boton.disabled).toBe(true);

    servidor
      .expectOne({ method: 'POST', url: `${base}/solicitudes/5/aceptar` })
      .flush(amistad('5', 'Eva'));
    await refrescar();
    expect(el.querySelector('.recibida')).toBeNull();
    expect(el.querySelector('.amigo .nombre')?.textContent).toBe('Eva');
    expect(el.querySelector('[role="status"]')?.textContent).toContain('Ahora eres amigo de Eva');
  });

  it('envía una solicitud por email y la muestra como pendiente', async () => {
    await cargar([]);
    await escribirEmailYEnviar('luis@correo.com');

    const peticion = servidor.expectOne({ method: 'POST', url: `${base}/solicitudes` });
    expect(peticion.request.body).toEqual({ email: 'luis@correo.com' });
    peticion.flush(amistad('9', 'Luis', 'PENDIENTE'));
    await refrescar();

    expect(el.querySelector('.enviada .nombre')?.textContent).toBe('Luis');
    expect(el.querySelector('[role="status"]')?.textContent).toContain('Solicitud enviada a Luis');
    expect(el.querySelector<HTMLInputElement>('#email-amigo')!.value).toBe('');
  });

  it('si esa persona ya te había invitado, pasa directamente a amigos', async () => {
    await cargar([], { recibidas: [amistad('3', 'Ana', 'PENDIENTE')], enviadas: [] });
    await escribirEmailYEnviar('ana@correo.com');
    servidor.expectOne(`${base}/solicitudes`).flush(amistad('3', 'Ana'));
    await refrescar();

    expect(el.querySelector('.recibida')).toBeNull();
    expect(el.querySelector('.amigo .nombre')?.textContent).toBe('Ana');
  });

  it('no envía nada si el email no es válido', async () => {
    await cargar([]);
    await escribirEmailYEnviar('no-es-un-email');
    expect(el.querySelector('.error-campo')?.textContent).toContain('El email no es válido');
    expect(el.querySelector('#email-amigo')?.getAttribute('aria-invalid')).toBe('true');
  });

  it('muestra el error del servidor al enviar (por ejemplo, ya sois amigos)', async () => {
    await cargar([amistad('1', 'Luis')]);
    await escribirEmailYEnviar('luis@correo.com');
    servidor
      .expectOne(`${base}/solicitudes`)
      .flush({ error: 'Ya sois amigos' }, { status: 409, statusText: 'Conflict' });
    await refrescar();
    expect(el.querySelector('.fallo')?.textContent).toContain('Ya sois amigos');
  });

  it('si falla la carga muestra el error y permite reintentar', async () => {
    servidor.expectOne(base).flush(null, { status: 500, statusText: 'Server Error' });
    servidor.expectOne(`${base}/solicitudes`);
    await refrescar();
    expect(el.querySelector('.aviso[role="alert"]')?.textContent).toContain('Error en el servidor');

    el.querySelector<HTMLButtonElement>('.aviso button')!.click();
    await refrescar();
    await cargar([amistad('1', 'Luis')]);
    expect(el.querySelectorAll('.amigo').length).toBe(1);
  });
});
